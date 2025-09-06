import './select.scss';

export interface  SelectOption {
  label: string;
  value: string;
}

export interface SelectProperties {
  fieldId: string;
  label: string;
  options: SelectOption[];
}

export const select = ({ fieldId, label, options }: SelectProperties): string => {

  return `
<div class="settings-select">
    <label for="${fieldId}" class="settings-select__label">${label}</label>
    <div class="settings-select__box">
      <select id="${fieldId}" class="settings-select__select">
        ${
          options.map(({ value, label }) => (
            `<option value="${value}">${label}</option>`
          ))
        }
      </select>
    </div>
  </div>
`;
}
