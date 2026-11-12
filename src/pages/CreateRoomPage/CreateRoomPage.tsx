import { type ChangeEvent, type FormEvent, useState } from 'react';
import { useNavigate } from 'react-router';
import { track } from '../../analytics/analytics.ts';
import { type ContentType, RoomApiError, createRoom } from '../../api/roomsApi.ts';
import BrandButton from '../../components/BrandButton/BrandButton.tsx';
import BrandChip from '../../components/BrandChip/BrandChip.tsx';
import BrandField from '../../components/BrandField/BrandField.tsx';
import BrandFormSection from '../../components/BrandFormSection/BrandFormSection.tsx';
import BrandHeader from '../../components/BrandHeader/BrandHeader.tsx';
import { FEATURES } from '../../config/features.ts';
import {
  CONTENT_TYPES,
  GENRES_BY_CONTENT_TYPE,
  MAX_DURATIONS_MIN,
  MAX_GENRES,
  STREAMING_SERVICES,
} from '../../data/content.ts';
import { SEO } from '../../data/seo.ts';
import { usePageMeta } from '../../hooks/usePageMeta.ts';
import { roomPath } from '../../routes.ts';
import { getNameFeedback, validateDisplayName } from '../../utils/validation.ts';
import '../../styles/cinema.css';
import '../../styles/landing.css';
import './CreateRoomPage.css';

interface Form {
  hostName: string;
  contentType: ContentType;
  genreIds: number[];
  durationsMin: number[];
  streamingServices: string[];
}

const INITIAL_FORM: Form = {
  hostName: '',
  contentType: 'MOVIES', // the backend always needs one (Movies by default)
  genreIds: [],
  durationsMin: [], // any number of 90 / 120 / 150
  streamingServices: [],
};

export default function CreateRoomPage() {
  const navigate = useNavigate();
  usePageMeta(SEO.createRoom);
  const [form, setForm] = useState(INITIAL_FORM);
  const [serverNameError, setServerNameError] = useState('');
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const genres = GENRES_BY_CONTENT_TYPE[form.contentType];

  // Live feedback: the name is checked while typing, genres are counted. The button waits for both.
  const nameError = getNameFeedback(form.hostName) || serverNameError;
  const genreError = form.genreIds.length > MAX_GENRES ? `Choose up to ${MAX_GENRES} genres` : '';
  const canSubmit = !validateDisplayName(form.hostName) && !genreError;

  /**
   * Exactly one content type is always selected. Genres belong to a content type: switching it
   * keeps the selected genres that exist in the new list (e.g. Comedy) and drops the rest.
   */
  const selectContentType = (contentType: ContentType) =>
    setForm((current) => {
      const available = GENRES_BY_CONTENT_TYPE[contentType];
      return {
        ...current,
        contentType,
        genreIds: current.genreIds.filter((id) => available.some((genre) => genre.id === id)),
      };
    });

  /** Multiple choice. */
  const toggleMany = <K extends 'genreIds' | 'durationsMin' | 'streamingServices'>(
    field: K,
    value: Form[K][number],
  ) =>
    setForm((current) => {
      const list: (string | number)[] = current[field];
      return {
        ...current,
        [field]: list.includes(value) ? list.filter((item) => item !== value) : [...list, value],
      };
    });

  const handleNameChange = (event: ChangeEvent<HTMLInputElement>) => {
    setForm((current) => ({ ...current, hostName: event.target.value }));
    setServerNameError('');
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const hostName = form.hostName.trim();
    if (!canSubmit) return;

    setIsSubmitting(true);
    setFormError('');
    try {
      // `streamingServices` is not sent: the backend has no such field yet (FEATURES.streamingServices).
      const room = await createRoom({
        hostName,
        contentType: form.contentType,
        genreIds: form.genreIds,
        durationsMin: form.durationsMin,
      });
      track('room_created', {
        content_type: form.contentType,
        genre_count: form.genreIds.length,
        duration_count: form.durationsMin.length,
      });
      navigate(roomPath(room.code));
    } catch (error) {
      const message =
        error instanceof RoomApiError ? error.message : 'Something went wrong. Please try again.';
      if (error instanceof RoomApiError && error.field === 'name') setServerNameError(message);
      else setFormError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // The button stays disabled until the name is valid and no more than MAX_GENRES genres are chosen.

  return (
    <div className="create-room-page cinema-page cinema-page--create landing">
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
              success={!validateDisplayName(form.hostName)}
              maxLength={60}
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

            <BrandFormSection
              title="Genres"
              counter={`(${form.genreIds.length}/${MAX_GENRES})`}
              error={genreError}
            >
              {genres.map(({ id, name }) => {
                const selected = form.genreIds.includes(id);
                return (
                  <BrandChip
                    key={id}
                    label={name}
                    selected={selected}
                    onToggle={() => toggleMany('genreIds', id)}
                  />
                );
              })}
            </BrandFormSection>

            <BrandFormSection title="Duration">
              {MAX_DURATIONS_MIN.map((minutes) => (
                <BrandChip
                  key={minutes}
                  label={`${minutes} min`}
                  selected={form.durationsMin.includes(minutes)}
                  onToggle={() => toggleMany('durationsMin', minutes)}
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
          <BrandButton
            type="submit"
            className="create-room__submit"
            disabled={!canSubmit || isSubmitting}
          >
            Create room
          </BrandButton>
        </form>
      </main>
    </div>
  );
}
