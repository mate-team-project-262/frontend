import { useState } from 'react';
import { useNavigate } from 'react-router';
import { RoomApiError, createRoom } from '../../api/roomsApi.js';
import BrandButton from '../../components/BrandButton/BrandButton.jsx';
import BrandChip from '../../components/BrandChip/BrandChip.jsx';
import BrandField from '../../components/BrandField/BrandField.jsx';
import BrandFormSection from '../../components/BrandFormSection/BrandFormSection.jsx';
import BrandHeader from '../../components/BrandHeader/BrandHeader.jsx';
import { FEATURES } from '../../config/features.js';
import {
  CONTENT_TYPES,
  GENRES_BY_CONTENT_TYPE,
  MAX_DURATIONS_MIN,
  MAX_GENRES,
  STREAMING_SERVICES,
} from '../../data/content.js';
import { roomPath } from '../../routes.js';
import { DISPLAY_NAME_MAX_LENGTH, validateDisplayName } from '../../utils/validation.js';
import '../../styles/landing.css';
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

  /** Genres: up to MAX_GENRES; once the limit is reached the other chips are locked. */
  const toggleGenre = (id) =>
    setForm((current) => {
      if (current.genreIds.includes(id)) {
        return { ...current, genreIds: current.genreIds.filter((item) => item !== id) };
      }
      if (current.genreIds.length >= MAX_GENRES) return current;
      return { ...current, genreIds: [...current.genreIds, id] };
    });

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

  const isGenreLimitReached = form.genreIds.length >= MAX_GENRES;

  return (
    <div className="create-room-page landing">
      <BrandHeader />
      <main className="create-room">
        <form className="create-room__panel" onSubmit={handleSubmit} noValidate>
          <h1 className="create-room__title">Create your movie room</h1>
          <p className="create-room__subtitle">
            Set the preferences that will shape this 20-movie session
          </p>

          <div className="create-room__fields">
            <BrandField
              label="Your name"
              placeholder="Enter your name"
              hint="This is how other participants will see you."
              value={form.hostName}
              error={nameError}
              maxLength={DISPLAY_NAME_MAX_LENGTH}
              onChange={handleNameChange}
            />

            <BrandFormSection title="Content type">
              {CONTENT_TYPES.map(({ value, label }) => (
                <BrandChip
                  key={value}
                  label={label}
                  selected={form.contentType === value}
                  onToggle={() => selectContentType(value)}
                />
              ))}
            </BrandFormSection>

            <BrandFormSection title="Genres" counter={`(${form.genreIds.length}/${MAX_GENRES})`}>
              {genres.map(({ id, name }) => {
                const selected = form.genreIds.includes(id);
                return (
                  <BrandChip
                    key={id}
                    label={name}
                    selected={selected}
                    disabled={!selected && isGenreLimitReached}
                    onToggle={() => toggleGenre(id)}
                  />
                );
              })}
            </BrandFormSection>

            <BrandFormSection title="Duration">
              {MAX_DURATIONS_MIN.map((minutes) => (
                <BrandChip
                  key={minutes}
                  label={`${minutes} min`}
                  selected={form.maxDurationMin === minutes}
                  onToggle={() => toggleSingle('maxDurationMin', minutes)}
                />
              ))}
            </BrandFormSection>

            {FEATURES.streamingServices && (
              <BrandFormSection title="Streaming services">
                {STREAMING_SERVICES.map((service) => (
                  <BrandChip
                    key={service}
                    label={service}
                    selected={form.streamingServices.includes(service)}
                    onToggle={() => toggleMany('streamingServices', service)}
                  />
                ))}
              </BrandFormSection>
            )}
          </div>

          {formError && (
            <p className="create-room__error" role="alert">
              {formError}
            </p>
          )}
          <BrandButton type="submit" className="create-room__submit" disabled={isSubmitting}>
            Create room
          </BrandButton>
        </form>
      </main>
    </div>
  );
}
