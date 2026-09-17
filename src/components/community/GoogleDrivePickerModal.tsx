import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Search, 
  Folder, 
  FileText, 
  Image as ImageIcon, 
  Film, 
  Music, 
  Archive, 
  Code, 
  File, 
  ArrowLeft, 
  RefreshCw, 
  Check, 
  ExternalLink,
  HardDrive,
  Link2,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { 
  GoogleDriveFile, 
  listGoogleDriveFiles, 
  getGoogleDriveFileMetadata, 
  extractDriveFileId, 
  formatDriveFileSize, 
  getDriveFileTypeCategory 
} from '../../lib/googleDriveService';

interface GoogleDrivePickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectFile: (file: GoogleDriveFile) => void;
}

export const GoogleDrivePickerModal: React.FC<GoogleDrivePickerModalProps> = ({
  isOpen,
  onClose,
  onSelectFile,
}) => {
  const { user, connectGoogleDrive, getDriveAccessToken } = useAuth();
  const [token, setToken] = useState<string | null>(getDriveAccessToken());
  const [isConnecting, setIsConnecting] = useState(false);
  const [isLoadingFiles, setIsLoadingFiles] = useState(false);
  const [files, setFiles] = useState<GoogleDriveFile[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentFolderId, setCurrentFolderId] = useState<string | undefined>(undefined);
  const [folderHistory, setFolderHistory] = useState<{ id?: string; name: string }[]>([
    { id: undefined, name: 'Mi unidad' }
  ]);
  const [selectedFile, setSelectedFile] = useState<GoogleDriveFile | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Modo enlace directo
  const [activeTab, setActiveTab] = useState<'browse' | 'link'>('browse');
  const [directLinkInput, setDirectLinkInput] = useState('');
  const [isVerifyingLink, setIsVerifyingLink] = useState(false);

  // Conectar con Google Drive
  const handleConnect = async () => {
    setIsConnecting(true);
    setError(null);
    try {
      const accessToken = await connectGoogleDrive();
      setToken(accessToken);
    } catch (err: any) {
      setError(err?.message || 'No se pudo conectar con Google Drive.');
    } finally {
      setIsConnecting(false);
    }
  };

  // Cargar lista de archivos de Drive
  const loadFiles = useCallback(async (accessToken: string, folderId?: string, query?: string) => {
    setIsLoadingFiles(true);
    setError(null);
    try {
      const response = await listGoogleDriveFiles(accessToken, {
        folderId,
        queryText: query,
        pageSize: 40,
      });
      setFiles(response.files);
    } catch (err: any) {
      console.error('Error cargando archivos de Drive:', err);
      // Si el token caducó o es inválido, permitir reconectar
      if (err.message && (err.message.includes('401') || err.message.includes('Invalid Credentials') || err.message.includes('Auth'))) {
        setToken(null);
        setError('La sesión de Google Drive ha expirado. Por favor, vuelve a conectar tu cuenta.');
      } else {
        setError(err?.message || 'Error al listar los archivos de Google Drive.');
      }
    } finally {
      setIsLoadingFiles(false);
    }
  }, []);

  // Efecto inicial al abrir
  useEffect(() => {
    if (isOpen) {
      const currentToken = getDriveAccessToken();
      setToken(currentToken);
      setSelectedFile(null);
      setError(null);
      if (currentToken) {
        loadFiles(currentToken, currentFolderId, searchQuery);
      }
    }
  }, [isOpen, getDriveAccessToken, loadFiles, currentFolderId, searchQuery]);

  // Manejo de carpetas
  const handleOpenFolder = (folder: GoogleDriveFile) => {
    setCurrentFolderId(folder.id);
    setFolderHistory((prev) => [...prev, { id: folder.id, name: folder.name }]);
    setSelectedFile(null);
    if (token) {
      loadFiles(token, folder.id, '');
    }
  };

  const handleNavigateBack = (targetIndex: number) => {
    const target = folderHistory[targetIndex];
    const newHistory = folderHistory.slice(0, targetIndex + 1);
    setFolderHistory(newHistory);
    setCurrentFolderId(target.id);
    setSelectedFile(null);
    if (token) {
      loadFiles(token, target.id, '');
    }
  };

  // Confirmar selección del archivo
  const handleConfirmSelection = () => {
    if (!selectedFile) return;
    onSelectFile(selectedFile);
    onClose();
  };

  // Verificar enlace directo pegado por el usuario
  const handleVerifyDirectLink = async (e: React.FormEvent) => {
    e.preventDefault();
    const url = directLinkInput.trim();
    if (!url) return;

    const fileId = extractDriveFileId(url);
    if (!fileId) {
      setError('Enlace no válido. Asegúrate de pegar una URL de Google Drive válida (ej: https://drive.google.com/file/d/...)');
      return;
    }

    setIsVerifyingLink(true);
    setError(null);

    try {
      if (token) {
        // Intenta obtener metadatos con el token si está disponible
        const metadata = await getGoogleDriveFileMetadata(token, fileId);
        onSelectFile(metadata);
        onClose();
      } else {
        // Si no tiene token pero pegó un enlace público válido, construir objeto de archivo
        const inferredFile: GoogleDriveFile = {
          id: fileId,
          name: 'Archivo de Google Drive',
          mimeType: 'application/octet-stream',
          webViewLink: url,
        };
        onSelectFile(inferredFile);
        onClose();
      }
    } catch (err: any) {
      // Fallback si el archivo es privado o no se pudo consultar
      const fallbackFile: GoogleDriveFile = {
        id: fileId,
        name: 'Archivo de Google Drive (Enlace)',
        mimeType: 'application/octet-stream',
        webViewLink: url,
      };
      onSelectFile(fallbackFile);
      onClose();
    } finally {
      setIsVerifyingLink(false);
    }
  };

  // Renderizar icono según categoría de archivo
  const renderFileIcon = (file: GoogleDriveFile) => {
    const category = getDriveFileTypeCategory(file.mimeType, file.name);
    switch (category) {
      case 'folder':
        return <Folder className="w-5 h-5 text-amber-500 fill-amber-100" />;
      case 'image':
        return <ImageIcon className="w-5 h-5 text-emerald-500" />;
      case 'video':
        return <Film className="w-5 h-5 text-indigo-500" />;
      case 'audio':
        return <Music className="w-5 h-5 text-purple-500" />;
      case 'archive':
        return <Archive className="w-5 h-5 text-amber-600" />;
      case 'code':
        return <Code className="w-5 h-5 text-sky-500" />;
      case 'document':
        return <FileText className="w-5 h-5 text-blue-500" />;
      default:
        return <File className="w-5 h-5 text-slate-400" />;
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/65 backdrop-blur-xs overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="w-full max-w-2xl bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden my-auto flex flex-col max-h-[85vh] text-left"
        >
          {/* Header */}
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shrink-0 shadow-xs">
                <HardDrive className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-extrabold text-slate-900">
                    Google Drive para Creadores
                  </h3>
                  <span className="px-2 py-0.5 rounded-md bg-emerald-100/70 text-emerald-800 text-[10px] font-bold">
                    Soporta archivos de varios GBs
                  </span>
                </div>
                <p className="text-xs text-slate-500">
                  Conecta tu cuenta y elige qué archivo deseas compartir con la comunidad
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Selector de Pestañas: Explorador vs Enlace Directo */}
          <div className="px-6 pt-3 border-b border-slate-100 flex items-center gap-4 bg-slate-50/30">
            <button
              type="button"
              onClick={() => setActiveTab('browse')}
              className={`pb-2.5 text-xs font-bold transition-all border-b-2 cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'browse'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <HardDrive className="w-4 h-4" />
              <span>Explorar mi Google Drive</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('link')}
              className={`pb-2.5 text-xs font-bold transition-all border-b-2 cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'link'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Link2 className="w-4 h-4" />
              <span>Pegar Enlace Directo de Drive</span>
            </button>
          </div>

          {/* CUERPO DEL MODAL */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {error && (
              <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-700 font-medium flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div className="flex-1">{error}</div>
              </div>
            )}

            {activeTab === 'browse' ? (
              !token ? (
                /* Estado: Requiere conectar Google Drive */
                <div className="py-8 px-4 text-center flex flex-col items-center justify-center space-y-4 max-w-md mx-auto">
                  <div className="w-16 h-16 rounded-3xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-sm">
                    <HardDrive className="w-8 h-8 stroke-[1.75]" />
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-slate-900">
                      Conecta tu cuenta de Google Drive
                    </h4>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                      Autoriza el acceso para seleccionar fotos, vídeos, archivos comprimidos (.zip/.rar) o proyectos completos sin límite de tamaño de archivo.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleConnect}
                    disabled={isConnecting}
                    className="w-full py-3 px-5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm shadow-md shadow-indigo-600/20 transition-all cursor-pointer flex items-center justify-center gap-2"
                  >
                    {isConnecting ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <svg className="w-4 h-4" viewBox="0 0 24 24">
                        <path fill="#ffffff" d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM19 18H6c-2.21 0-4-1.79-4-4 0-2.05 1.53-3.76 3.56-3.97l1.07-.11.5-.95C8.08 7.14 9.94 6 12 6c2.62 0 4.88 1.86 5.39 4.43l.3 1.5 1.53.11c1.56.1 2.78 1.41 2.78 2.96 0 1.65-1.35 3-3 3z"/>
                      </svg>
                    )}
                    <span>{isConnecting ? 'Conectando con Google...' : 'Conectar con Google Drive'}</span>
                  </button>

                  <p className="text-[11px] text-slate-400">
                    Solo se accede a los archivos que tú decidas compartir explícitamente.
                  </p>
                </div>
              ) : (
                /* Estado: Conectado con Drive - Explorador de Archivos */
                <div className="space-y-3">
                  {/* Barra de búsqueda y navegación */}
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Buscar archivos por nombre..."
                        className="w-full pl-9 pr-3 py-2 text-xs text-slate-800 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => token && loadFiles(token, currentFolderId, searchQuery)}
                      disabled={isLoadingFiles}
                      className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors cursor-pointer"
                      title="Refrescar archivos"
                    >
                      <RefreshCw className={`w-4 h-4 ${isLoadingFiles ? 'animate-spin text-indigo-600' : ''}`} />
                    </button>
                  </div>

                  {/* Migas de pan (Breadcrumbs) de carpetas */}
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 overflow-x-auto py-1">
                    {folderHistory.map((folder, index) => (
                      <React.Fragment key={folder.id || 'root'}>
                        {index > 0 && <span className="text-slate-300">/</span>}
                        <button
                          type="button"
                          onClick={() => handleNavigateBack(index)}
                          className={`font-semibold hover:underline cursor-pointer truncate max-w-[140px] ${
                            index === folderHistory.length - 1 ? 'text-indigo-600 font-bold' : 'text-slate-600'
                          }`}
                        >
                          {folder.name}
                        </button>
                      </React.Fragment>
                    ))}
                  </div>

                  {/* Lista de Archivos */}
                  <div className="border border-slate-200 rounded-2xl overflow-hidden bg-slate-50/40 min-h-[260px] max-h-[340px] overflow-y-auto">
                    {isLoadingFiles ? (
                      <div className="py-16 text-center text-xs text-slate-400 flex flex-col items-center justify-center gap-2">
                        <RefreshCw className="w-5 h-5 animate-spin text-indigo-600" />
                        <span>Cargando tus archivos de Google Drive...</span>
                      </div>
                    ) : files.length === 0 ? (
                      <div className="py-16 text-center text-xs text-slate-400">
                        No se encontraron archivos en esta ubicación.
                      </div>
                    ) : (
                      <div className="divide-y divide-slate-100">
                        {files.map((file) => {
                          const isFolder = file.mimeType === 'application/vnd.google-apps.folder';
                          const isSelected = selectedFile?.id === file.id;

                          return (
                            <div
                              key={file.id}
                              onClick={() => {
                                if (isFolder) {
                                  handleOpenFolder(file);
                                } else {
                                  setSelectedFile(file);
                                }
                              }}
                              className={`p-3 flex items-center justify-between gap-3 cursor-pointer transition-colors ${
                                isSelected
                                  ? 'bg-indigo-50/90 border-l-4 border-l-indigo-600'
                                  : 'hover:bg-white bg-transparent'
                              }`}
                            >
                              <div className="flex items-center gap-3 min-w-0">
                                <div className="shrink-0 p-1.5 rounded-lg bg-white border border-slate-200/80 shadow-2xs">
                                  {renderFileIcon(file)}
                                </div>
                                <div className="min-w-0">
                                  <p className="text-xs font-bold text-slate-900 truncate">
                                    {file.name}
                                  </p>
                                  <p className="text-[11px] text-slate-500">
                                    {isFolder ? 'Carpeta' : formatDriveFileSize(file.size)}
                                  </p>
                                </div>
                              </div>

                              <div className="shrink-0 flex items-center gap-2">
                                {isFolder ? (
                                  <span className="text-xs text-slate-400 font-semibold">Abrir →</span>
                                ) : (
                                  isSelected && (
                                    <span className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center shadow-xs">
                                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                                    </span>
                                  )
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Resumen del archivo seleccionado */}
                  {selectedFile && (
                    <div className="p-3 rounded-2xl bg-indigo-50/70 border border-indigo-100 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Check className="w-4 h-4 text-indigo-600 shrink-0" />
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-indigo-950 truncate">
                            {selectedFile.name}
                          </p>
                          <p className="text-[10px] text-indigo-700">
                            {formatDriveFileSize(selectedFile.size)} • Listo para adjuntar
                          </p>
                        </div>
                      </div>
                      <a
                        href={selectedFile.webViewLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1 text-indigo-600 hover:text-indigo-800"
                        title="Ver en Google Drive"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </div>
                  )}
                </div>
              )
            ) : (
              /* Pestaña: Enlace Directo */
              <form onSubmit={handleVerifyDirectLink} className="space-y-4 py-2">
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                  <label className="text-xs font-bold text-slate-800 block">
                    Pega el enlace de tu archivo compartido en Google Drive:
                  </label>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Asegúrate de que en Google Drive el archivo tenga el acceso configurado como <strong>"Cualquier persona con el enlace"</strong> para que otros miembros de la comunidad puedan descargarlo.
                  </p>
                  <div className="relative mt-2">
                    <Link2 className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="url"
                      value={directLinkInput}
                      onChange={(e) => setDirectLinkInput(e.target.value)}
                      placeholder="https://drive.google.com/file/d/..."
                      required
                      className="w-full pl-9 pr-3 py-2.5 text-xs text-slate-900 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={isVerifyingLink || !directLinkInput.trim()}
                    className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-bold shadow-sm transition-all cursor-pointer flex items-center gap-2"
                  >
                    {isVerifyingLink ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Check className="w-3.5 h-3.5" />
                    )}
                    <span>{isVerifyingLink ? 'Verificando...' : 'Adjuntar enlace de Drive'}</span>
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Footer con botones de acción */}
          <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div>
              {token && (
                <button
                  type="button"
                  onClick={handleConnect}
                  className="text-xs text-slate-500 hover:text-indigo-600 font-medium cursor-pointer"
                >
                  Cambiar cuenta de Drive
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer min-h-[38px]"
              >
                Cancelar
              </button>

              {activeTab === 'browse' && (
                <button
                  type="button"
                  onClick={handleConfirmSelection}
                  disabled={!selectedFile}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-bold shadow-md shadow-indigo-600/20 transition-all flex items-center gap-2 cursor-pointer min-h-[38px]"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Adjuntar archivo seleccionado</span>
                </button>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
