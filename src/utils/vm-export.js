import React from 'react';
import { Input } from 'antd';
import { formatMessage } from '@/utils/intl';

const VM_EXPORT_NAME_INVALID_PATTERN = /[\u4e00-\u9fa5\s]/g;

export const sanitizeVMExportName = value => (value || '').replace(VM_EXPORT_NAME_INVALID_PATTERN, '');

export const normalizeVMExportName = value => sanitizeVMExportName((value || '').trim());

export const createVMExportNameContent = (defaultValue, onNameChange) => (
  <div>
    <Input
      defaultValue={defaultValue}
      placeholder={formatMessage({ id: 'Vm.export.namePlaceholder' })}
      onChange={e => {
        const sanitizedValue = sanitizeVMExportName(e.target.value);
        if (sanitizedValue !== e.target.value) {
          e.target.value = sanitizedValue;
        }
        onNameChange(sanitizedValue);
      }}
    />
    <div style={{ marginTop: 8, color: '#8d9bad' }}>
      {formatMessage({ id: 'mirror.input.rule' })}
    </div>
  </div>
);
