import { useState } from 'react';
import { useNavigate } from 'react-router';
import { createRoom } from '../../api/roomsApi.js';
import Button from '../../components/Button/Button.jsx';
import Chip from '../../components/Chip/Chip.jsx';
import FormSection from '../../components/FormSection/FormSection.jsx';
import Header from '../../components/Header/Header.jsx';
import TextField from '../../components/TextField/TextField.jsx';
import {
  CONTENT_TYPES,
  GENRES,
  MAX_DURATIONS_MIN,
  STREAMING_SERVICES,
} from '../../data/content.js';
import { roomPath } from '../../routes.js';
import './CreateRoomPage.css';

const INITIAL_FORM = {
  hostName: '',
  contentType: null, // 'movie' | 'tv' | null
  genres: [],
  maxDurationMin: null,
  streamingServices: [],
};

export default function CreateRoomPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState(INITIAL_FORM);
  const [nameError, setNameError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

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
    if (!hostName) {
      setNameError('Please enter your name');
      return;
    }

    setIsSubmitting(true);
    try {
      const room = await createRoom({
        hostName,
        contentType: form.contentType,
        genres: form.genres,
        maxDurationMin: form.maxDurationMin,
        streamingServices: form.streamingServices,
      });
      navigate(roomPath(room.code));
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
              maxLength={40}
              onChange={handleNameChange}
            />

            <FormSection title="Content type">
              {CONTENT_TYPES.map(({ value, label }) => (
                <Chip
                  key={value}
                  label={label}
                  selected={form.contentType === value}
                  onToggle={() => toggleSingle('contentType', value)}
                />
              ))}
            </FormSection>

            <FormSection title="Genres">
              {GENRES.map((genre) => (
                <Chip
                  key={genre}
                  label={genre}
                  selected={form.genres.includes(genre)}
                  onToggle={() => toggleMany('genres', genre)}
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
          </div>

          <Button block type="submit" className="create-room__submit" disabled={isSubmitting}>
            Create room
          </Button>
        </form>
      </main>
    </div>
  );
}
