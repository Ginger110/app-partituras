import { useState } from 'react';
import { useApp } from '../../context/useApp';
import { isValidUrl } from '../../utils/difficultyUtils';
import BadgeDificultad from '../components/BadgeDificultad';

export default function SubirPartituraPage() {
  const { obras, createPartitura, setCurrentView, uiState, addToast } = useApp();

  const [modo, setModo] = useState('obra_nueva'); // 'obra_nueva' | 'arreglo_existente'

  const [form, setForm] = useState({
    // Modo A: Obra nueva
    nombre_obra: '',
    autor_obra: '',
    // Modo B: Obra existente
    id_obra: obras[0]?.id || 1,
    // Comunes
    nombre_partitura: '',
    instrumentacion: 'Piano solo',
    estilo: 'Romántico',
    arreglo: 'Transcripción Urtext',
    arreglista: '',
    transcriptor: '',
    editor: '',
    dificultadEstimada: 4.5,
    precio: 0,
    url: '',
    info: ''
  });

  const [errors, setErrors] = useState({});

  const handleInputChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  const validate = () => {
    const errs = {};

    if (modo === 'obra_nueva') {
      if (!form.nombre_obra.trim()) {
        errs.nombre_obra = 'Debes ingresar el título de la obra original.';
      }
      if (!form.autor_obra.trim()) {
        errs.autor_obra = 'Debes ingresar el nombre del compositor.';
      }
    } else {
      if (!form.id_obra) {
        errs.id_obra = 'Debes seleccionar una obra existente.';
      }
    }

    if (!form.nombre_partitura.trim()) {
      errs.nombre_partitura = 'El título de la partitura / edición es obligatorio.';
    }

    if (!form.instrumentacion) {
      errs.instrumentacion = 'Selecciona la instrumentación principal.';
    }

    // Validación ESTRICTA y obligatoria de URL
    if (!form.url || !form.url.trim()) {
      errs.url = 'El enlace a la partitura (PDF/URL oficial) es obligatorio.';
    } else if (!isValidUrl(form.url)) {
      errs.url = 'Formato de URL inválido. Debe comenzar con http:// o https:// (ej: https://imslp.org/...)';
    }

    const diffNum = parseFloat(form.dificultadEstimada);
    if (isNaN(diffNum) || diffNum < 1.0 || diffNum > 10.0) {
      errs.dificultadEstimada = 'La dificultad estimada debe ser un número entre 1.0 y 10.0.';
    }

    return errs;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const validationErrors = validate();

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      addToast('Hay campos requeridos incompletos o con formato inválido.', 'error');
      return;
    }

    createPartitura({
      modo,
      ...form
    });
  };

  // Si uiState === 'error', simular validaciones visuales en rojo
  const displayedErrors = uiState === 'error' ? {
    nombre_obra: 'Campo obligatorio: ingresa el título de la obra original.',
    autor_obra: 'Campo obligatorio: ingresa el nombre del compositor.',
    nombre_partitura: 'Título de la edición obligatorio.',
    url: 'Error de validación: La URL es obligatoria y debe iniciar con https://'
  } : errors;

  return (
    <div className="subir-view" aria-label="Subir Nueva Partitura">
      <div className="subir-container">
        {/* Encabezado */}
        <div className="subir-header-card">
          <div className="subir-header-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#4F46E5" strokeWidth="2.2">
              <path d="M12 5v14M5 12h14"></path>
            </svg>
          </div>
          <div>
            <h1 className="subir-title">Publicar Obra o Arreglo en el Catálogo (CU03)</h1>
            <p className="subir-subtitle">
              Sube una partitura nueva o aporta un arreglo/transcripción a una obra ya catalogada. El sistema calibrará su dificultad dinámicamente con los ratings comunitarios.
            </p>
          </div>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="subir-form-card" noValidate>
          {/* 1. SELECTOR DE MODALIDAD (RADIO BUTTONS) */}
          <div className="modalidad-selection-section">
            <span className="modalidad-title">1. Selecciona la Modalidad de Publicación:</span>
            <div className="modalidad-radios-grid">
              <label
                className={`modalidad-radio-card ${modo === 'obra_nueva' ? 'modalidad-radio-active' : ''}`}
                onClick={() => setModo('obra_nueva')}
              >
                <div className="modalidad-card-top">
                  <input
                    type="radio"
                    name="modalidadSubida"
                    value="obra_nueva"
                    checked={modo === 'obra_nueva'}
                    onChange={() => setModo('obra_nueva')}
                  />
                  <div className="modalidad-badge">Opción A</div>
                </div>
                <div className="modalidad-card-info">
                  <h3 className="modalidad-label">Obra Inexistente (Nueva)</h3>
                  <p className="modalidad-desc">
                    Registra una obra que aún no figura en la base de datos junto con su primera partitura.
                  </p>
                </div>
              </label>

              <label
                className={`modalidad-radio-card ${modo === 'arreglo_existente' ? 'modalidad-radio-active' : ''}`}
                onClick={() => setModo('arreglo_existente')}
              >
                <div className="modalidad-card-top">
                  <input
                    type="radio"
                    name="modalidadSubida"
                    value="arreglo_existente"
                    checked={modo === 'arreglo_existente'}
                    onChange={() => setModo('arreglo_existente')}
                  />
                  <div className="modalidad-badge">Opción B</div>
                </div>
                <div className="modalidad-card-info">
                  <h3 className="modalidad-label">Nueva Versión / Arreglo</h3>
                  <p className="modalidad-desc">
                    Asocia una nueva edición, arreglo o transcripción instrumental a una obra ya existente.
                  </p>
                </div>
              </label>
            </div>
          </div>

          {/* 2. CAMPOS CONDICIONALES SEGÚN MODALIDAD */}
          <div className="form-section-box">
            <h3 className="form-subheading">
              {modo === 'obra_nueva' ? '2. Datos de la Obra Original' : '2. Selección de Obra Existente'}
            </h3>

            {modo === 'obra_nueva' ? (
              <div className="form-grid-2">
                <div className="form-field-group">
                  <label htmlFor="obra-nombre" className="form-label">
                    Título de la Obra <span className="req-star">*</span>
                  </label>
                  <input
                    id="obra-nombre"
                    type="text"
                    className={`form-input ${displayedErrors.nombre_obra ? 'form-input-error' : ''}`}
                    placeholder="Ej: Claro de Luna, Danza Macabra, etc."
                    value={form.nombre_obra}
                    onChange={(e) => handleInputChange('nombre_obra', e.target.value)}
                  />
                  {displayedErrors.nombre_obra && (
                    <span className="field-error-msg">{displayedErrors.nombre_obra}</span>
                  )}
                </div>

                <div className="form-field-group">
                  <label htmlFor="obra-autor" className="form-label">
                    Compositor / Autor <span className="req-star">*</span>
                  </label>
                  <input
                    id="obra-autor"
                    type="text"
                    className={`form-input ${displayedErrors.autor_obra ? 'form-input-error' : ''}`}
                    placeholder="Ej: Claude Debussy, Camille Saint-Saëns..."
                    value={form.autor_obra}
                    onChange={(e) => handleInputChange('autor_obra', e.target.value)}
                  />
                  {displayedErrors.autor_obra && (
                    <span className="field-error-msg">{displayedErrors.autor_obra}</span>
                  )}
                </div>
              </div>
            ) : (
              <div className="form-field-group">
                <label htmlFor="obra-select" className="form-label">
                  Selecciona la Obra Registrada <span className="req-star">*</span>
                </label>
                <select
                  id="obra-select"
                  className="form-select"
                  value={form.id_obra}
                  onChange={(e) => handleInputChange('id_obra', e.target.value)}
                >
                  {obras.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.nombre} — {o.autor} ({o.epoca})
                    </option>
                  ))}
                </select>
                <span className="field-hint">
                  Esta nueva partitura quedará vinculada al registro maestro de la obra para estadísticas cruzadas.
                </span>
              </div>
            )}
          </div>

          {/* 3. DETALLES DE LA EDICIÓN / PARTITURA */}
          <div className="form-section-box">
            <h3 className="form-subheading">3. Ficha Técnica de la Partitura y Enlace</h3>

            <div className="form-grid-2">
              <div className="form-field-group">
                <label htmlFor="partitura-nombre" className="form-label">
                  Título de la Edición / Versión <span className="req-star">*</span>
                </label>
                <input
                  id="partitura-nombre"
                  type="text"
                  className={`form-input ${displayedErrors.nombre_partitura ? 'form-input-error' : ''}`}
                  placeholder="Ej: Edición Urtext con digitaciones para concierto"
                  value={form.nombre_partitura}
                  onChange={(e) => handleInputChange('nombre_partitura', e.target.value)}
                />
                {displayedErrors.nombre_partitura && (
                  <span className="field-error-msg">{displayedErrors.nombre_partitura}</span>
                )}
              </div>

              <div className="form-field-group">
                <label htmlFor="partitura-inst" className="form-label">
                  Instrumentación <span className="req-star">*</span>
                </label>
                <select
                  id="partitura-inst"
                  className="form-select"
                  value={form.instrumentacion}
                  onChange={(e) => handleInputChange('instrumentacion', e.target.value)}
                >
                  <option value="Piano solo">Piano solo</option>
                  <option value="Violín">Violín (solo o con piano)</option>
                  <option value="Guitarra">Guitarra clásica</option>
                  <option value="Violonchelo">Violonchelo y Piano</option>
                  <option value="Flauta">Flauta traversa</option>
                  <option value="Ensamble de cámara">Ensamble de cámara</option>
                </select>
              </div>

              <div className="form-field-group">
                <label htmlFor="partitura-estilo" className="form-label">
                  Época / Estilo Musical
                </label>
                <select
                  id="partitura-estilo"
                  className="form-select"
                  value={form.estilo}
                  onChange={(e) => handleInputChange('estilo', e.target.value)}
                >
                  <option value="Barroco">Barroco</option>
                  <option value="Clásico">Clásico</option>
                  <option value="Romántico">Romántico</option>
                  <option value="Impresionista">Impresionista</option>
                  <option value="Contemporáneo">Contemporáneo</option>
                  <option value="Jazz">Jazz</option>
                </select>
              </div>

              <div className="form-field-group">
                <label htmlFor="partitura-editor" className="form-label">
                  Editor / Transcriptor / Arreglista
                </label>
                <input
                  id="partitura-editor"
                  type="text"
                  className="form-input"
                  placeholder="Ej: Bärenreiter, Henle Verlag o Nombre del músico"
                  value={form.editor}
                  onChange={(e) => handleInputChange('editor', e.target.value)}
                />
              </div>

              <div className="form-field-group">
                <label htmlFor="partitura-diff" className="form-label">
                  Dificultad Técnica Inicial Estimada (1.0 - 10.0)
                </label>
                <div className="diff-input-row">
                  <input
                    id="partitura-diff"
                    type="range"
                    min="1.0"
                    max="10.0"
                    step="0.5"
                    value={form.dificultadEstimada}
                    onChange={(e) => handleInputChange('dificultadEstimada', parseFloat(e.target.value))}
                    className="filter-range-slider"
                  />
                  <BadgeDificultad score={parseFloat(form.dificultadEstimada)} size="md" />
                </div>
                <span className="field-hint">
                  Puntaje semilla de partida; luego evolucionará con los ratings de otros músicos.
                </span>
              </div>

              <div className="form-field-group">
                <label htmlFor="partitura-precio" className="form-label">
                  Precio de Licencia (CLP)
                </label>
                <input
                  id="partitura-precio"
                  type="number"
                  min="0"
                  step="500"
                  className="form-input"
                  placeholder="0 para Acceso Libre (Gratis)"
                  value={form.precio}
                  onChange={(e) => handleInputChange('precio', e.target.value)}
                />
                <span className="field-hint">Ingresa 0 si la obra es de dominio público o descarga libre.</span>
              </div>
            </div>

            {/* CAMPO OBLIGATORIO DE URL (CON VALIDACIÓN ESTRICTA) */}
            <div className="form-field-group url-highlight-group">
              <label htmlFor="partitura-url" className="form-label">
                URL Correspondiente de la Partitura (PDF o Fuente Oficial) <span className="req-star">*</span>
              </label>
              <div className="url-input-wrapper">
                <svg className="url-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"></path>
                  <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"></path>
                </svg>
                <input
                  id="partitura-url"
                  type="url"
                  className={`form-input url-input ${displayedErrors.url ? 'form-input-error' : ''}`}
                  placeholder="https://imslp.org/... o https://midominio.com/partitura.pdf"
                  value={form.url}
                  onChange={(e) => handleInputChange('url', e.target.value)}
                  required
                />
              </div>
              {displayedErrors.url && (
                <span className="field-error-msg">{displayedErrors.url}</span>
              )}
              <span className="field-hint">
                Requisito obligatorio: enlace directo al archivo de partitura o repositorio público.
              </span>
            </div>

            {/* Notas adicionales */}
            <div className="form-field-group">
              <label htmlFor="partitura-info" className="form-label">
                Notas de Ejecución / Información Técnica
              </label>
              <textarea
                id="partitura-info"
                rows="3"
                className="form-textarea"
                placeholder="Indica recomendaciones de tempo, compases complejos o sugerencias pedagógicas..."
                value={form.info}
                onChange={(e) => handleInputChange('info', e.target.value)}
              />
            </div>
          </div>

          {/* Botones de acción */}
          <div className="form-submit-footer">
            <button
              type="button"
              className="btn-secondary"
              onClick={() => setCurrentView('catalogo')}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="btn-primary btn-submit-score"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
              Publicar Partitura en el Catálogo
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
