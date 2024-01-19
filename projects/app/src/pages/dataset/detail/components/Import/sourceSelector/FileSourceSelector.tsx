import React, { useState } from 'react';
import MyModal from '@/components/MyModal';
import { ModalBody, ModalFooter, Button } from '@chakra-ui/react';
import { useTranslation } from 'next-i18next';
import LeftRadio from '@fastgpt/web/components/common/Radio/LeftRadio';
import { ImportDataSourceEnum } from '..';
import { useRouter } from 'next/router';
import { TabEnum } from '../../..';

const FileModeSelector = ({ onClose }: { onClose: () => void }) => {
  const { t } = useTranslation();
  const router = useRouter();
  const [value, setValue] = useState<`${ImportDataSourceEnum}`>(ImportDataSourceEnum.fileLocal);

  return (
    <MyModal
      isOpen
      onClose={onClose}
      iconSrc="modal/selectSource"
      title={t('core.dataset.import.Select source')}
      w={'600px'}
    >
      <ModalBody px={6} py={4}>
        <LeftRadio
          list={[
            {
              title: t('core.dataset.import.Local file'),
              desc: t('core.dataset.import.Local file desc'),
              value: ImportDataSourceEnum.fileLocal
            },
            {
              title: t('core.dataset.import.Web link'),
              desc: t('core.dataset.import.Web link desc'),
              value: ImportDataSourceEnum.fileLink
            },
            {
              title: t('core.dataset.import.Custom text'),
              desc: t('core.dataset.import.Custom text desc'),
              value: ImportDataSourceEnum.fileCustom
            }
          ]}
          value={value}
          onChange={setValue}
        />
      </ModalBody>
      <ModalFooter>
        <Button
          onClick={() =>
            router.replace({
              query: {
                ...router.query,
                currentTab: TabEnum.import,
                source: value
              }
            })
          }
        >
          {t('common.Confirm')}
        </Button>
      </ModalFooter>
    </MyModal>
  );
};

export default FileModeSelector;
