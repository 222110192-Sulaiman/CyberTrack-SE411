import { useState } from 'react';
import { Save } from 'lucide-react';
import { FIREWALL_FIELDS, MANUFACTURERS, STATUSES } from '../../data/constants';
import { todayISODate } from '../../utils/validation';
import FormField from '../ui/FormField';
import { SelectInput, TextArea, TextInput } from '../ui/Inputs';
import Button from '../ui/Button';
import styles from './FirewallForm.module.css';

const FIELD_LABELS = {
  name: 'Firewall Name',
  manufacturer: 'Manufacturer',
  model: 'Model',
  serialNumber: 'Serial Number',
  ipAddress: 'IP Address',
  location: 'Location',
  status: 'Status',
  firmwareVersion: 'Firmware Version',
  purchaseDate: 'Purchase Date',
  notes: 'Notes',
};

const HINTS = {
  ipAddress: 'IPv4 format, e.g. 192.168.1.1',
};

const NOTES_MAX = 500;

const fieldId = (name) => `fw-${name}`;

function focusField(name) {
  document.getElementById(fieldId(name))?.focus();
}

function firstInvalid(errors) {
  return FIREWALL_FIELDS.find((field) => errors[field]);
}

/**
 * Shared Add / Edit form (NFR-MNT-03).
 * @param {'add'|'edit'} mode
 * @param {object} initialValues  Values for every editable field.
 * @param {(values) => object} validate  Returns field -> message.
 * @param {(values) => Promise} onSubmit  May reject with a ValidationError carrying `errors`.
 */
export default function FirewallForm({ mode, assetId, initialValues, validate, onSubmit, onCancel }) {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  function handleChange(event) {
    const { name, value } = event.target;
    const next = { ...values, [name]: value };
    setValues(next);
    // Errors are shown after the first Save attempt, then kept live.
    if (submitted) setErrors(validate(next));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (saving) return;
    setSubmitted(true);
    setFormError('');

    const found = validate(values);
    setErrors(found);
    const invalid = firstInvalid(found);
    if (invalid) {
      focusField(invalid);
      return;
    }

    setSaving(true);
    try {
      await onSubmit(values);
    } catch (error) {
      if (error?.name === 'ValidationError') {
        setErrors(error.errors);
        focusField(firstInvalid(error.errors));
      } else {
        setFormError('Something went wrong while saving. Please try again.');
      }
      setSaving(false);
    }
  }

  function controlProps(name) {
    const describedBy = [HINTS[name] && `${fieldId(name)}-hint`, errors[name] && `${fieldId(name)}-error`]
      .filter(Boolean)
      .join(' ');
    return {
      id: fieldId(name),
      name,
      value: values[name],
      onChange: handleChange,
      'aria-invalid': errors[name] ? true : undefined,
      'aria-describedby': describedBy || undefined,
    };
  }

  function field(name, control, { required = false, wide = false, aside } = {}) {
    return (
      <FormField
        id={fieldId(name)}
        label={FIELD_LABELS[name]}
        required={required}
        hint={HINTS[name]}
        error={errors[name]}
        wide={wide}
        aside={aside}
      >
        {control}
      </FormField>
    );
  }

  const errorEntries = FIREWALL_FIELDS.filter((f) => errors[f]).map((f) => [f, errors[f]]);
  const notesLength = values.notes.length;

  return (
    <form className={styles.form} onSubmit={handleSubmit} noValidate>
      <p className={styles.legendNote}>
        Fields marked <span className={styles.required}>*</span> are required.
      </p>

      {submitted && errorEntries.length >= 2 && (
        <div className={styles.summary} role="alert">
          <p className={styles.summaryTitle}>Please correct {errorEntries.length} errors:</p>
          <ul>
            {errorEntries.map(([name, message]) => (
              <li key={name}>
                <a
                  href={`#${fieldId(name)}`}
                  onClick={(event) => {
                    event.preventDefault();
                    focusField(name);
                  }}
                >
                  {FIELD_LABELS[name]}: {message}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}

      {formError && (
        <div className={styles.summary} role="alert">
          <p className={styles.summaryTitle}>{formError}</p>
        </div>
      )}

      <fieldset className={styles.section}>
        <legend className={styles.sectionTitle}>Identification</legend>
        <div className={styles.grid}>
          {mode === 'edit' && (
            <FormField id="fw-id" label="Asset ID" wide>
              <TextInput id="fw-id" value={assetId} readOnly className="mono" />
            </FormField>
          )}
          {field('name', <TextInput {...controlProps('name')} required aria-required="true" autoComplete="off" />, {
            required: true,
          })}
          {field(
            'manufacturer',
            <SelectInput {...controlProps('manufacturer')} required aria-required="true">
              <option value="">Select a manufacturer…</option>
              {MANUFACTURERS.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </SelectInput>,
            { required: true },
          )}
          {field('model', <TextInput {...controlProps('model')} required aria-required="true" autoComplete="off" />, {
            required: true,
          })}
          {field('serialNumber', <TextInput {...controlProps('serialNumber')} className="mono" autoComplete="off" />)}
        </div>
      </fieldset>

      <fieldset className={styles.section}>
        <legend className={styles.sectionTitle}>Network &amp; Location</legend>
        <div className={styles.grid}>
          {field(
            'ipAddress',
            <TextInput
              {...controlProps('ipAddress')}
              className="mono"
              inputMode="decimal"
              placeholder="e.g. 10.0.0.1"
              required
              aria-required="true"
              autoComplete="off"
            />,
            { required: true },
          )}
          {field('location', <TextInput {...controlProps('location')} required aria-required="true" />, {
            required: true,
          })}
        </div>
      </fieldset>

      <fieldset className={styles.section}>
        <legend className={styles.sectionTitle}>Operational Details</legend>
        <div className={styles.grid}>
          {field(
            'status',
            <SelectInput {...controlProps('status')} required aria-required="true">
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </SelectInput>,
            { required: true },
          )}
          {field('firmwareVersion', <TextInput {...controlProps('firmwareVersion')} className="mono" autoComplete="off" />)}
          {field('purchaseDate', <TextInput {...controlProps('purchaseDate')} type="date" max={todayISODate()} />)}
          {field('notes', <TextArea {...controlProps('notes')} rows={4} />, {
            wide: true,
            aside: (
              <span className={`${styles.counter} ${notesLength > NOTES_MAX ? styles.counterOver : ''}`}>
                {notesLength} / {NOTES_MAX}
              </span>
            ),
          })}
        </div>
      </fieldset>

      <div className={styles.actions}>
        <Button variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" icon={Save} aria-disabled={saving || undefined}>
          {saving ? 'Saving…' : mode === 'edit' ? 'Save Changes' : 'Save Firewall'}
        </Button>
      </div>
    </form>
  );
}
