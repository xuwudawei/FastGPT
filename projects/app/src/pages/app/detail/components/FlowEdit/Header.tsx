import React, { useCallback, useRef, useState } from 'react';
import { Box, Flex, IconButton, useTheme, useDisclosure } from '@chakra-ui/react';
import { SmallCloseIcon } from '@chakra-ui/icons';
import { ModuleItemType } from '@fastgpt/global/core/module/type';
import { useRequest } from '@/web/common/hooks/useRequest';
import { AppSchema } from '@fastgpt/global/core/app/type.d';
import { useTranslation } from 'next-i18next';
import { useCopyData } from '@/web/common/hooks/useCopyData';
import { AppTypeEnum } from '@fastgpt/global/core/app/constants';
import dynamic from 'next/dynamic';

import MyIcon from '@fastgpt/web/components/common/Icon';
import MyTooltip from '@/components/MyTooltip';
import ChatTest, { type ChatTestComponentRef } from '@/components/core/module/Flow/ChatTest';
import { useFlowProviderStore } from '@/components/core/module/Flow/FlowProvider';
import { flowNode2Modules, filterExportModules } from '@/components/core/module/utils';
import { useAppStore } from '@/web/core/app/store/useAppStore';
import { useToast } from '@fastgpt/web/hooks/useToast';
import { useConfirm } from '@/web/common/hooks/useConfirm';
import { getErrText } from '@fastgpt/global/common/error/utils';

const ImportSettings = dynamic(() => import('@/components/core/module/Flow/ImportSettings'));

type Props = { app: AppSchema; onClose: () => void };

const RenderHeaderContainer = React.memo(function RenderHeaderContainer({
  app,
  ChatTestRef,
  testModules,
  setTestModules,
  onClose
}: Props & {
  ChatTestRef: React.RefObject<ChatTestComponentRef>;
  testModules?: ModuleItemType[];
  setTestModules: React.Dispatch<ModuleItemType[] | undefined>;
}) {
  const theme = useTheme();
  const { toast } = useToast();
  const { t } = useTranslation();
  const { copyData } = useCopyData();
  const { openConfirm: openConfirmOut, ConfirmModal } = useConfirm({
    content: t('core.app.edit.Out Ad Edit')
  });
  const { isOpen: isOpenImport, onOpen: onOpenImport, onClose: onCloseImport } = useDisclosure();
  const { updateAppDetail } = useAppStore();
  const { nodes, edges, splitToolInputs } = useFlowProviderStore();
  const [isSaving, setIsSaving] = useState(false);

  const flow2ModulesAndCheck = useCallback(async () => {
    const modules = flowNode2Modules({ nodes, edges });
    // check required connect
    for (let i = 0; i < modules.length; i++) {
      const item = modules[i];

      const { isTool } = splitToolInputs(item.inputs, item.moduleId);

      const unconnected = item.inputs.find((input) => {
        if (!input.required || input.connected || (isTool && input.toolDescription)) {
          return false;
        }
        if (input.value === undefined || input.value === '' || input.value?.length === 0) {
          return true;
        }
        return false;
      });

      if (unconnected) {
        const msg = t('core.module.Unlink tip', { name: t(item.name) });

        toast({
          status: 'warning',
          title: msg
        });
        return false;
      }
    }
    return modules;
  }, [edges, nodes, splitToolInputs, t, toast]);

  const onclickSave = useCallback(
    async (modules: ModuleItemType[]) => {
      setIsSaving(true);
      try {
        await updateAppDetail(app._id, {
          modules: modules,
          type: AppTypeEnum.advanced,
          permission: undefined
        });
        toast({
          status: 'success',
          title: t('common.Save Success')
        });
        ChatTestRef.current?.resetChatTest();
      } catch (error) {
        toast({
          status: 'warning',
          title: getErrText(error, t('common.Save Failed'))
        });
      }
      setIsSaving(false);
    },
    [ChatTestRef, app._id, t, toast, updateAppDetail]
  );

  const saveAndBack = useCallback(async () => {
    try {
      const modules = await flow2ModulesAndCheck();
      if (modules) {
        await onclickSave(modules);
      }
      onClose();
    } catch (error) {
      toast({
        status: 'warning',
        title: getErrText(error)
      });
    }
  }, [flow2ModulesAndCheck, onClose, onclickSave, toast]);

  return (
    <>
      <Flex
        py={3}
        px={[2, 5, 8]}
        borderBottom={theme.borders.base}
        alignItems={'center'}
        userSelect={'none'}
        bg={'myGray.25'}
      >
        <IconButton
          size={'smSquare'}
          icon={<MyIcon name={'common/backFill'} w={'14px'} />}
          borderRadius={'50%'}
          w={'26px'}
          h={'26px'}
          borderColor={'myGray.300'}
          variant={'whiteBase'}
          aria-label={''}
          isLoading={isSaving}
          onClick={openConfirmOut(saveAndBack, onClose)}
        />
        <Box ml={[3, 6]} fontSize={['md', '2xl']} flex={1}>
          {app.name}
        </Box>

        <MyTooltip label={t('app.Import Configs')}>
          <IconButton
            mr={[3, 6]}
            size={'smSquare'}
            icon={<MyIcon name={'common/importLight'} w={['14px', '16px']} />}
            variant={'whitePrimary'}
            aria-label={'save'}
            onClick={onOpenImport}
          />
        </MyTooltip>
        <MyTooltip label={t('app.Export Configs')}>
          <IconButton
            mr={[3, 6]}
            icon={<MyIcon name={'export'} w={['14px', '16px']} />}
            size={'smSquare'}
            variant={'whitePrimary'}
            aria-label={'save'}
            onClick={async () => {
              const modules = await flow2ModulesAndCheck();
              if (modules) {
                copyData(filterExportModules(modules), t('app.Export Config Successful'));
              }
            }}
          />
        </MyTooltip>

        {testModules ? (
          <IconButton
            mr={[3, 6]}
            icon={<SmallCloseIcon fontSize={'25px'} />}
            variant={'whitePrimary'}
            size={'smSquare'}
            aria-label={''}
            onClick={() => setTestModules(undefined)}
          />
        ) : (
          <MyTooltip label={t('core.Chat test')}>
            <IconButton
              mr={[3, 6]}
              icon={<MyIcon name={'core/chat/chatLight'} w={['14px', '16px']} />}
              size={'smSquare'}
              aria-label={'save'}
              variant={'whitePrimary'}
              onClick={async () => {
                const modules = await flow2ModulesAndCheck();
                if (modules) {
                  setTestModules(modules);
                }
              }}
            />
          </MyTooltip>
        )}

        <MyTooltip label={t('common.Save')}>
          <IconButton
            icon={<MyIcon name={'common/saveFill'} w={['14px', '16px']} />}
            size={'smSquare'}
            isLoading={isSaving}
            aria-label={'save'}
            onClick={async () => {
              const modules = await flow2ModulesAndCheck();
              if (modules) {
                onclickSave(modules);
              }
            }}
          />
        </MyTooltip>
      </Flex>
      {isOpenImport && <ImportSettings onClose={onCloseImport} />}
      <ConfirmModal
        closeText={t('core.app.edit.UnSave')}
        confirmText={t('core.app.edit.Save and out')}
      />
    </>
  );
});

const Header = (props: Props) => {
  const { app } = props;
  const ChatTestRef = useRef<ChatTestComponentRef>(null);

  const [testModules, setTestModules] = useState<ModuleItemType[]>();

  return (
    <>
      <RenderHeaderContainer
        {...props}
        ChatTestRef={ChatTestRef}
        testModules={testModules}
        setTestModules={setTestModules}
      />
      <ChatTest
        ref={ChatTestRef}
        modules={testModules}
        app={app}
        onClose={() => setTestModules(undefined)}
      />
    </>
  );
};

export default React.memo(Header);
