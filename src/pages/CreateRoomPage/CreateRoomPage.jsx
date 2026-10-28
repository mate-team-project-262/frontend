import { useState } from 'react';
import { useNavigate } from 'react-router';
import { RoomApiError, createRoom } from '../../api/roomsApi.js';
import Button from '../../components/Button/Button.jsx';
import Chip from '../../components/Chip/Chip.jsx';
import FormSection from '../../components/FormSection/FormSection.jsx';
import Header from '../../components/Header/Header.jsx';
import TextField from '../../components/TextField/TextField.jsx';
import { FEATURES } from '../../config/features.js';
import {
  CONTENT_TYPES,
  GENRES_BY_CONTENT_TYPE,
  MAX_DURATIONS_MIN,
  STREAMING_SERVICES,
} from '../../data/content.js';
import { roomPath } from '../../routes.js';
import { DISPLAY_NAME_MAX_LENGTH, validateDisplayName } from '../../utils/validation.js';
import './CreateRoomPage.css';

const INITIAL_FORM = {
  hostName: '',
  contentType: 'MOVIES', // 'MOVIES' | 'TV_SERIES' - the backend always needs one (Movies by default)
  genreIds: [],
  maxDurationMin: null,
  streamingServices: [],
};

export default function CreateRoomPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState(INITIAL_FORM);
  const [nameError, setNameError] = useState('');
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const genres = GENRES_BY_CONTENT_TYPE[form.contentType];

  /**
   * Exactly one content type is always selected. Genres belong to a content type: switching it
   * keeps the selected genres that exist in the new list (e.g. Comedy) and drops the rest.
   */
  const selectContentType = (contentType) =>
    setForm((current) => {
      const available = GENRES_BY_CONTENT_TYPE[contentType];
      return {
        ...current,
        contentType,
        genreIds: current.genreIds.filter((id) => available.some((genre) => genre.id === id)),
      };
    });

  /** Single choice: clicking the selected chip again clears it. */
  const toggleSingle = (field, value) =>
    setForm((current) => ({ ...current, [field]: current[field] === value ? null : value }));

  /** Multiple choice. */
  const toggleMany = (field, value) =>
    setForm((current) => ({
      ...current,
      [field]: current[field].includes(value)
        ? current[field].filter((item) => item !== value)
        : [...current[field], value],
    }));

  const handleNameChange = (event) => {
    setForm((current) => ({ ...current, hostName: event.target.value }));
    setNameError('');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const hostName = form.hostName.trim();
    const validationError = validateDisplayName(hostName);
    if (validationError) {
      setNameError(validationError);
      return;
    }

    setIsSubmitting(true);
    setFormError('');
    try {
      const payload = {
        hostName,
        contentType: form.contentType,
        genreIds: form.genreIds,
        maxDurationMin: form.maxDurationMin,
      };
      if (FEATURES.streamingServices) payload.streamingServices = form.streamingServices;
      const room = await createRoom(payload);
      navigate(roomPath(room.code));
    } catch (error) {
      const message =
        error instanceof RoomApiError ? error.message : 'Something went wrong. Please try again.';
      if (error.field === 'name') setNameError(message);
      else setFormError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="create-room-page">
      <Header variant="back" />
      <main className="create-room">
        <form className="create-room__panel" onSubmit={handleSubmit} noValidate>
          <h1 className="create-room__title">Create your movie room</h1>
          <p className="create-room__subtitle">
            Set the preferences that will shape this 20-movie session
          </p>

          <div className="create-room__fields">
            <TextField
              label="Your name"
              value={form.hostName}
              error={nameError}
              maxLength={DISPLAY_NAME_MAX_LENGTH}
              onChange={handleNameChange}
            />

            <FormSection title="Content type">
              {CONTENT_TYPES.map(({ value, label }) => (
                <Chip
                  key={value}
                  label={label}
                  selected={form.contentType === value}
                  onToggle={() => selectContentType(value)}
                />
              ))}
            </FormSection>

            <FormSection title="Genres">
              {genres.map(({ id, name }) => (
                <Chip
                  key={id}
                  label={name}
                  selected={form.genreIds.includes(id)}
                  onToggle={() => toggleMany('genreIds', id)}
                />
              ))}
            </FormSection>

            <FormSection title="Max duration">
              {MAX_DURATIONS_MIN.map((minutes) => (
                <Chip
                  key={minutes}
                  label={`${minutes} min`}
                  selected={form.maxDurationMin === minutes}
                  onToggle={() => toggleSingle('maxDurationMin', minutes)}
                />
              ))}
            </FormSection>

            {FEATURES.streamingServices && (
              <FormSection title="Streaming services">
                {STREAMING_SERVICES.map((service) => (
                  <Chip
                    key={service}
                    label={service}
                    selected={form.streamingServices.includes(service)}
                    onToggle={() => toggleMany('streamingServices', service)}
                  />
                ))}
              </FormSection>
            )}
          </div>

          {formError && (
            <p className="create-room__error" role="alert">
              {formError}
            </p>
          )}
          <Button block type="submit" className="create-room__submit" disabled={isSubmitting}>
            Create room
          </Button>
        </form>
      </main>
    </div>
  );
}
