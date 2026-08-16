import apiClient from './client';

export const authApi = {
  login: (credentials) => apiClient.post('/auth/login', credentials),
  logout: () => apiClient.post('/auth/logout'),
  getCurrentUser: () => apiClient.get('/auth/me'),
};

export const usersApi = {
  findAll: (params) => apiClient.get('/users', { params }),
  findById: (id) => apiClient.get(`/users/${id}`),
  create: (data) => apiClient.post('/users', data),
  update: (id, data) => apiClient.put(`/users/${id}`, data),
  delete: (id) => apiClient.delete(`/users/${id}`),
  findByEmail: (email) => apiClient.get(`/users/email/${email}`),
};

export const rolesApi = {
  findAll: (params) => apiClient.get('/roles', { params }),
  findById: (id) => apiClient.get(`/roles/${id}`),
  create: (data) => apiClient.post('/roles', data),
  update: (id, data) => apiClient.put(`/roles/${id}`, data),
  delete: (id) => apiClient.delete(`/roles/${id}`),
  findByPermissionId: (permissionId, params) => apiClient.get(`/roles/permission/${permissionId}`, { params }),
  findByName: (name) => apiClient.get(`/roles/name/${name}`),
};

export const permissionsApi = {
  findAll: (params) => apiClient.get('/permissions', { params }),
  findById: (id) => apiClient.get(`/permissions/${id}`),
  create: (data) => apiClient.post('/permissions', data),
  update: (id, data) => apiClient.put(`/permissions/${id}`, data),
  delete: (id) => apiClient.delete(`/permissions/${id}`),
  findByName: (name) => apiClient.get(`/permissions/name/${name}`),
};

export const vehiculosApi = {
  findAll: (params) => apiClient.get('/vehiculos', { params }),
  findById: (id) => apiClient.get(`/vehiculos/${id}`),
  create: (data) => apiClient.post('/vehiculos', data),
  update: (id, data) => apiClient.put(`/vehiculos/${id}`, data),
  delete: (id) => apiClient.delete(`/vehiculos/${id}`),
  findByTipoVehiculoId: (tipoVehiculoId, params) => apiClient.get(`/vehiculos/tipo-vehiculo/${tipoVehiculoId}`, { params }),
  findByTipoCombustibleId: (tipoCombustibleId, params) => apiClient.get(`/vehiculos/tipo-combustible/${tipoCombustibleId}`, { params }),
  findSinChoferAsignado: (params) => apiClient.get('/vehiculos/sin-chofer', { params }),
  findByChoferId: (choferId, params) => apiClient.get(`/vehiculos/chofer/${choferId}`, { params }),
};

export const tiposVehiculoApi = {
  findAll: (params) => apiClient.get('/tipos-vehiculo', { params }),
  findById: (id) => apiClient.get(`/tipos-vehiculo/${id}`),
  create: (data) => apiClient.post('/tipos-vehiculo', data),
  update: (id, data) => apiClient.put(`/tipos-vehiculo/${id}`, data),
  delete: (id) => apiClient.delete(`/tipos-vehiculo/${id}`),
};

export const tiposCombustibleApi = {
  findAll: (params) => apiClient.get('/tipos-combustible', { params }),
  findById: (id) => apiClient.get(`/tipos-combustible/${id}`),
  create: (data) => apiClient.post('/tipos-combustible', data),
  update: (id, data) => apiClient.put(`/tipos-combustible/${id}`, data),
  delete: (id) => apiClient.delete(`/tipos-combustible/${id}`),
  findByCodigo: (codigo) => apiClient.get(`/tipos-combustible/codigo/${codigo}`),
};

export const marcasApi = {
  findAll: (params) => apiClient.get('/marcas', { params }),
  findById: (id) => apiClient.get(`/marcas/${id}`),
  create: (data) => apiClient.post('/marcas', data),
  update: (id, data) => apiClient.put(`/marcas/${id}`, data),
  delete: (id) => apiClient.delete(`/marcas/${id}`),
};

export const empresasApi = {
  findAll: (params) => apiClient.get('/empresas', { params }),
  findById: (id) => apiClient.get(`/empresas/${id}`),
  create: (data) => apiClient.post('/empresas', data),
  update: (id, data) => apiClient.put(`/empresas/${id}`, data),
  delete: (id) => apiClient.delete(`/empresas/${id}`),
  findByCodigo: (codigo) => apiClient.get(`/empresas/codigo/${codigo}`),
};

export const choferesApi = {
  findAll: (params) => apiClient.get('/choferes', { params }),
  findById: (id) => apiClient.get(`/choferes/${id}`),
  create: (data) => apiClient.post('/choferes', data),
  update: (id, data) => apiClient.put(`/choferes/${id}`, data),
  delete: (id) => apiClient.delete(`/choferes/${id}`),
};

export const categoriasLicenciaApi = {
  findAll: (params) => apiClient.get('/categorias-licencia', { params }),
  findById: (id) => apiClient.get(`/categorias-licencia/${id}`),
  create: (data) => apiClient.post('/categorias-licencia', data),
  update: (id, data) => apiClient.put(`/categorias-licencia/${id}`, data),
  delete: (id) => apiClient.delete(`/categorias-licencia/${id}`),
  findByCodigo: (codigo) => apiClient.get(`/categorias-licencia/codigo/${codigo}`),
};

export const choferesCategoriasApi = {
  findAll: (params) => apiClient.get('/choferes-categorias', { params }),
  findById: (id) => apiClient.get(`/choferes-categorias/${id}`),
  create: (data) => apiClient.post('/choferes-categorias', data),
  update: (id, data) => apiClient.put(`/choferes-categorias/${id}`, data),
  delete: (id) => apiClient.delete(`/choferes-categorias/${id}`),
  findByChoferId: (choferId, params) => apiClient.get(`/choferes-categorias/chofer/${choferId}`, { params }),
  findByCategoriaLicenciaId: (categoriaLicenciaId, params) => apiClient.get(`/choferes-categorias/categoria/${categoriaLicenciaId}`, { params }),
};

export const recorridosApi = {
  findAll: (params) => apiClient.get('/recorridos', { params }),
  findById: (id) => apiClient.get(`/recorridos/${id}`),
  create: (data) => apiClient.post('/recorridos', data),
  update: (id, data) => apiClient.put(`/recorridos/${id}`, data),
  delete: (id) => apiClient.delete(`/recorridos/${id}`),
  findByVehiculoId: (vehiculoId, params) => apiClient.get(`/recorridos/vehiculo/${vehiculoId}`, { params }),
  findByVehiculoIdAndFechaBetween: (vehiculoId, params) => apiClient.get(`/recorridos/vehiculo/${vehiculoId}/rango`, { params }),
};
