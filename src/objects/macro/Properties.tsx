import { ChevronDown, ChevronUp, Plus, Trash2 } from 'lucide-react';
import { useMemo } from 'react';
import type { MacroCommand, MacroCommandKind } from '../../domain/types';
import type { ObjectPropertiesProps } from '../ObjectModule';
import { CheckboxField, Field, PropertySection, SelectField, VtColorField } from '../../properties/fields';

const COMMAND_KIND_OPTIONS: { value: MacroCommandKind; label: string }[] = [
  { value: 'hideShowObject',       label: 'Hide/Show Object' },
  { value: 'changeNumericValue',   label: 'Change Numeric Value' },
  { value: 'changeBackgroundColor', label: 'Change Background Colour' },
  { value: 'changeActiveMask',     label: 'Change Active Mask' },
  { value: 'changeAttribute',      label: 'Change Attribute' },
];

const COMMAND_KIND_LABELS: Record<MacroCommandKind, string> = {
  hideShowObject:       'Hide/Show Object',
  changeNumericValue:   'Change Numeric Value',
  changeBackgroundColor: 'Change Background Colour',
  changeActiveMask:     'Change Active Mask',
  changeAttribute:      'Change Attribute',
};

function newCommand(kind: MacroCommandKind): MacroCommand {
  return { id: crypto.randomUUID(), kind };
}

export function MacroProperties({ object, objects, onPatch }: ObjectPropertiesProps) {
  const commands = object.macroCommands ?? [];

  // Build object options for target-object fields
  const objectOptions = useMemo(() => [
    { value: '', label: 'None' },
    ...objects
      .filter((o) => o.id !== object.id)
      .map((o) => ({ value: o.id, label: `${o.id} — ${o.name}` })),
  ], [objects, object.id]);

  // Build mask options (data-mask + alarm-mask)
  const maskOptions = useMemo(() => [
    { value: '', label: 'None' },
    ...objects
      .filter((o) => o.kind === 'data-mask' || o.kind === 'alarm-mask')
      .map((o) => ({ value: o.id, label: `${o.id} — ${o.name}` })),
  ], [objects]);

  function patchCommands(next: MacroCommand[]) {
    onPatch({ macroCommands: next });
  }

  function addCommand() {
    patchCommands([...commands, newCommand('changeNumericValue')]);
  }

  function removeCommand(index: number) {
    patchCommands(commands.filter((_, i) => i !== index));
  }

  function moveCommand(index: number, direction: -1 | 1) {
    const next = [...commands];
    const target = index + direction;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    patchCommands(next);
  }

  function patchCommand(index: number, changes: Partial<MacroCommand>) {
    patchCommands(commands.map((cmd, i) => i === index ? { ...cmd, ...changes } : cmd));
  }

  function changeKind(index: number, kind: MacroCommandKind) {
    // Reset kind-specific fields when changing command type
    patchCommands(commands.map((cmd, i) =>
      i === index
        ? { id: cmd.id, kind }
        : cmd,
    ));
  }

  return (
    <>
      <PropertySection title="Macro">
        <Field label="Object ID" value={object.objectId} type="text" onChange={() => {}} disabled />
        <Field label="Name" value={object.name} onChange={(name) => onPatch({ name })} />
        <Field
          label="Commands"
          value={`${commands.length} command${commands.length !== 1 ? 's' : ''}`}
          type="text"
          onChange={() => {}}
          disabled
        />
      </PropertySection>

      <PropertySection title="Commands">
        {commands.map((cmd, index) => (
          <div
            // eslint-disable-next-line react/no-array-index-key
            key={`cmd-${index}-${cmd.id}`}
            style={{ border: '1px solid #e5e7eb', borderRadius: 4, padding: 6, marginBottom: 6 }}
          >
            {/* Row: index + kind selector + move/delete */}
            <div style={{ display: 'flex', gap: 4, alignItems: 'center', marginBottom: 4 }}>
              <span style={{ fontSize: 11, color: '#6b7280', minWidth: 18 }}>{index + 1}</span>
              <select
                value={cmd.kind}
                onChange={(e) => changeKind(index, e.target.value as MacroCommandKind)}
                style={{ flex: 1, fontSize: 12, padding: '2px 4px' }}
              >
                {COMMAND_KIND_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
              <button
                type="button"
                title="Move up"
                disabled={index === 0}
                style={{ padding: '2px 4px', background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280' }}
                onClick={() => moveCommand(index, -1)}
              >
                <ChevronUp size={13} />
              </button>
              <button
                type="button"
                title="Move down"
                disabled={index === commands.length - 1}
                style={{ padding: '2px 4px', background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280' }}
                onClick={() => moveCommand(index, 1)}
              >
                <ChevronDown size={13} />
              </button>
              <button
                type="button"
                title="Remove command"
                style={{ padding: '2px 4px', background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444' }}
                onClick={() => removeCommand(index)}
              >
                <Trash2 size={13} />
              </button>
            </div>

            {/* Kind-specific fields */}
            <CommandFields
              cmd={cmd}
              objectOptions={objectOptions}
              maskOptions={maskOptions}
              onPatch={(changes) => patchCommand(index, changes)}
            />
          </div>
        ))}

        <button
          type="button"
          style={{
            display: 'flex', alignItems: 'center', gap: 4, fontSize: 12,
            padding: '4px 8px', cursor: 'pointer', background: 'none',
            border: '1px dashed #9ca3af', borderRadius: 4, color: '#6b7280',
            width: '100%', justifyContent: 'center',
          }}
          onClick={addCommand}
        >
          <Plus size={13} /> Add Command
        </button>
      </PropertySection>
    </>
  );
}

function CommandFields({
  cmd,
  objectOptions,
  maskOptions,
  onPatch,
}: {
  cmd: MacroCommand;
  objectOptions: { value: string; label: string }[];
  maskOptions: { value: string; label: string }[];
  onPatch: (changes: Partial<MacroCommand>) => void;
}) {
  switch (cmd.kind) {
    case 'hideShowObject':
      return (
        <>
          <SelectField
            label="Object"
            value={cmd.objectEditorId ?? ''}
            options={objectOptions}
            onChange={(v) => onPatch({ objectEditorId: v || undefined })}
          />
          <CheckboxField
            label="Show (unchecked = Hide)"
            checked={cmd.showObject ?? true}
            onChange={(showObject) => onPatch({ showObject })}
          />
        </>
      );

    case 'changeNumericValue':
      return (
        <>
          <SelectField
            label="Object"
            value={cmd.objectEditorId ?? ''}
            options={objectOptions}
            onChange={(v) => onPatch({ objectEditorId: v || undefined })}
          />
          <Field
            label="Value"
            type="number"
            value={cmd.numericValue ?? 0}
            onChange={(v) => onPatch({ numericValue: Math.max(0, Math.min(0xFFFFFFFF, Math.trunc(Number(v)))) })}
          />
        </>
      );

    case 'changeBackgroundColor':
      return (
        <>
          <SelectField
            label="Object"
            value={cmd.objectEditorId ?? ''}
            options={objectOptions}
            onChange={(v) => onPatch({ objectEditorId: v || undefined })}
          />
          <VtColorField
            label="Colour"
            value={cmd.colorIndex ?? 0}
            onChange={(colorIndex) => onPatch({ colorIndex })}
          />
        </>
      );

    case 'changeActiveMask':
      return (
        <SelectField
          label="New Mask"
          value={cmd.maskEditorId ?? ''}
          options={maskOptions}
          onChange={(v) => onPatch({ maskEditorId: v || undefined })}
        />
      );

    case 'changeAttribute':
      return (
        <>
          <SelectField
            label="Object"
            value={cmd.objectEditorId ?? ''}
            options={objectOptions}
            onChange={(v) => onPatch({ objectEditorId: v || undefined })}
          />
          <Field
            label="Attribute ID"
            type="number"
            value={cmd.attributeId ?? 0}
            onChange={(v) => onPatch({ attributeId: Math.max(0, Math.min(255, Math.trunc(Number(v)))) })}
          />
          <Field
            label="New Value"
            type="number"
            value={cmd.attributeValue ?? 0}
            onChange={(v) => onPatch({ attributeValue: Math.max(0, Math.min(0xFFFFFFFF, Math.trunc(Number(v)))) })}
          />
        </>
      );

    default:
      return null;
  }
}
