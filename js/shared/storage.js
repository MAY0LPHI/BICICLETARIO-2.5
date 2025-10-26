import { FileStorage } from './file-storage.js';

const isElectron = typeof window !== 'undefined' && window.electron && window.electron.isElectron;

let fileStorageAvailable = false;

async function checkFileStorage() {
    if (!isElectron) {
        fileStorageAvailable = await FileStorage.isAvailable();
        if (fileStorageAvailable) {
            console.log('✅ API de arquivos disponível - dados serão salvos em: dados/navegador/');
        } else {
            console.log('ℹ️ API de arquivos indisponível - usando localStorage');
        }
    }
}

checkFileStorage();

export const Storage = {
    async saveClients(clients) {
        if (isElectron) {
            for (const client of clients) {
                await window.electron.storage.saveClient(client);
            }
        } else {
            localStorage.setItem('bicicletario_clients', JSON.stringify(clients));
            if (fileStorageAvailable) {
                for (const client of clients) {
                    try {
                        await FileStorage.saveClient(client);
                    } catch (error) {
                        console.warn('Erro ao salvar cliente em arquivo:', error);
                    }
                }
            }
        }
    },

    async loadClients() {
        if (isElectron) {
            return await window.electron.storage.loadAllClients();
        } else {
            if (fileStorageAvailable) {
                try {
                    const clients = await FileStorage.loadAllClients();
                    localStorage.setItem('bicicletario_clients', JSON.stringify(clients));
                    return clients;
                } catch (error) {
                    console.warn('Erro ao carregar clientes de arquivo:', error);
                }
            }
            const data = localStorage.getItem('bicicletario_clients');
            return data ? JSON.parse(data) : [];
        }
    },

    async saveClient(client) {
        if (isElectron) {
            await window.electron.storage.saveClient(client);
            const allClients = await this.loadClients();
            return allClients;
        } else {
            const clients = this.loadClientsSync();
            const index = clients.findIndex(c => c.id === client.id);
            if (index >= 0) {
                clients[index] = client;
            } else {
                clients.push(client);
            }
            localStorage.setItem('bicicletario_clients', JSON.stringify(clients));
            
            if (fileStorageAvailable) {
                try {
                    await FileStorage.saveClient(client);
                } catch (error) {
                    console.warn('Erro ao salvar cliente em arquivo:', error);
                }
            }
            
            return clients;
        }
    },

    loadClientsSync() {
        const data = localStorage.getItem('bicicletario_clients');
        return data ? JSON.parse(data) : [];
    },

    async deleteClient(cpf) {
        if (isElectron) {
            return await window.electron.storage.deleteClient(cpf);
        } else {
            const clients = this.loadClientsSync();
            const filtered = clients.filter(c => c.cpf.replace(/\D/g, '') !== cpf.replace(/\D/g, ''));
            localStorage.setItem('bicicletario_clients', JSON.stringify(filtered));
            
            if (fileStorageAvailable) {
                try {
                    await FileStorage.deleteClient(cpf);
                } catch (error) {
                    console.warn('Erro ao deletar cliente de arquivo:', error);
                }
            }
            
            return { success: true };
        }
    },

    async saveRegistros(registros) {
        if (isElectron) {
            for (const registro of registros) {
                await window.electron.storage.saveRegistro(registro);
            }
        } else {
            localStorage.setItem('bicicletario_registros', JSON.stringify(registros));
            this.organizeRegistrosByDate(registros);
            
            if (fileStorageAvailable) {
                for (const registro of registros) {
                    try {
                        await FileStorage.saveRegistro(registro);
                    } catch (error) {
                        console.warn('Erro ao salvar registro em arquivo:', error);
                    }
                }
            }
        }
    },

    async saveRegistro(registro) {
        if (isElectron) {
            return await window.electron.storage.saveRegistro(registro);
        } else {
            const registros = this.loadRegistrosSync();
            const index = registros.findIndex(r => r.id === registro.id);
            if (index >= 0) {
                registros[index] = registro;
            } else {
                registros.push(registro);
            }
            localStorage.setItem('bicicletario_registros', JSON.stringify(registros));
            this.organizeRegistrosByDate(registros);
            
            if (fileStorageAvailable) {
                try {
                    await FileStorage.saveRegistro(registro);
                } catch (error) {
                    console.warn('Erro ao salvar registro em arquivo:', error);
                }
            }
            
            return { success: true };
        }
    },

    async loadRegistros() {
        if (isElectron) {
            return await window.electron.storage.loadAllRegistros();
        } else {
            if (fileStorageAvailable) {
                try {
                    const registros = await FileStorage.loadAllRegistros();
                    localStorage.setItem('bicicletario_registros', JSON.stringify(registros));
                    this.organizeRegistrosByDate(registros);
                    return registros;
                } catch (error) {
                    console.warn('Erro ao carregar registros de arquivo:', error);
                }
            }
            const data = localStorage.getItem('bicicletario_registros');
            return data ? JSON.parse(data) : [];
        }
    },

    loadRegistrosSync() {
        const data = localStorage.getItem('bicicletario_registros');
        return data ? JSON.parse(data) : [];
    },

    organizeRegistrosByDate(registros) {
        const organized = {};
        
        registros.forEach(registro => {
            const entryDate = new Date(registro.dataHoraEntrada);
            const year = entryDate.getFullYear().toString();
            const month = String(entryDate.getMonth() + 1).padStart(2, '0');
            const day = String(entryDate.getDate()).padStart(2, '0');
            
            if (!organized[year]) organized[year] = {};
            if (!organized[year][month]) organized[year][month] = {};
            if (!organized[year][month][day]) organized[year][month][day] = [];
            
            organized[year][month][day].push(registro);
        });
        
        localStorage.setItem('bicicletario_registros_organizados', JSON.stringify(organized));
        
        const summary = this.generateStorageSummary(organized);
        localStorage.setItem('bicicletario_registros_resumo', JSON.stringify(summary));
        
        return organized;
    },

    generateStorageSummary(organized) {
        const summary = {
            totalRegistros: 0,
            anos: {}
        };
        
        Object.keys(organized).forEach(year => {
            summary.anos[year] = {
                totalMeses: Object.keys(organized[year]).length,
                meses: {}
            };
            
            Object.keys(organized[year]).forEach(month => {
                const monthName = this.getMonthName(parseInt(month));
                summary.anos[year].meses[month] = {
                    nome: monthName,
                    totalDias: Object.keys(organized[year][month]).length,
                    totalRegistros: 0,
                    dias: {}
                };
                
                Object.keys(organized[year][month]).forEach(day => {
                    const dayRegistros = organized[year][month][day].length;
                    summary.anos[year].meses[month].totalRegistros += dayRegistros;
                    summary.anos[year].meses[month].dias[day] = dayRegistros;
                    summary.totalRegistros += dayRegistros;
                });
            });
        });
        
        return summary;
    },

    getMonthName(month) {
        const months = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
                       'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
        return months[month - 1];
    },

    async loadRegistrosByDate(year, month, day) {
        if (isElectron) {
            return await window.electron.storage.loadRegistrosByDate(year, month, day);
        } else {
            const organized = localStorage.getItem('bicicletario_registros_organizados');
            if (!organized) return [];
            
            const data = JSON.parse(organized);
            
            if (year && month && day) {
                return data[year]?.[month]?.[day] || [];
            } else if (year && month) {
                const monthData = data[year]?.[month] || {};
                return Object.values(monthData).flat();
            } else if (year) {
                const yearData = data[year] || {};
                return Object.values(yearData).map(month => Object.values(month).flat()).flat();
            }
            
            return [];
        }
    },

    async loadStorageSummary() {
        if (isElectron) {
            const structure = await window.electron.storage.getOrganizedStructure();
            return this.generateSummaryFromStructure(structure);
        } else {
            const data = localStorage.getItem('bicicletario_registros_resumo');
            return data ? JSON.parse(data) : null;
        }
    },

    generateSummaryFromStructure(structure) {
        const summary = {
            totalRegistros: 0,
            anos: {}
        };

        Object.keys(structure).forEach(year => {
            summary.anos[year] = {
                totalMeses: Object.keys(structure[year]).length,
                meses: {}
            };
            
            Object.keys(structure[year]).forEach(month => {
                const monthName = this.getMonthName(parseInt(month));
                summary.anos[year].meses[month] = {
                    nome: monthName,
                    totalDias: structure[year][month].length,
                    totalRegistros: 0,
                    dias: {}
                };
                
                structure[year][month].forEach(day => {
                    summary.anos[year].meses[month].dias[day] = 1;
                    summary.totalRegistros += 1;
                    summary.anos[year].meses[month].totalRegistros += 1;
                });
            });
        });
        
        return summary;
    },

    async getOrganizedRegistros() {
        if (isElectron) {
            return await window.electron.storage.getOrganizedStructure();
        } else {
            const data = localStorage.getItem('bicicletario_registros_organizados');
            return data ? JSON.parse(data) : {};
        }
    },

    async getStoragePath() {
        if (isElectron) {
            return await window.electron.storage.getStoragePath();
        }
        return null;
    },

    migrateOldData() {
        if (isElectron) {
            return null;
        }

        const oldData = localStorage.getItem('bicicletarioData');
        if (oldData && !localStorage.getItem('bicicletario_clients')) {
            try {
                const clientsWithRecords = JSON.parse(oldData);
                const newClients = [];
                const newRegistros = [];

                clientsWithRecords.forEach(client => {
                    const newClient = { ...client, bicicletas: [] };
                    (client.bicicletas || []).forEach(bike => {
                        const newBike = { ...bike };
                        if (bike.registros && Array.isArray(bike.registros)) {
                            bike.registros.forEach(registro => {
                                newRegistros.push({
                                    ...registro,
                                    clientId: client.id,
                                    bikeId: bike.id
                                });
                            });
                        }
                        delete newBike.registros;
                        newClient.bicicletas.push(newBike);
                    });
                    newClients.push(newClient);
                });

                localStorage.setItem('bicicletario_clients', JSON.stringify(newClients));
                localStorage.setItem('bicicletario_registros', JSON.stringify(newRegistros));
                this.organizeRegistrosByDate(newRegistros);
                localStorage.removeItem('bicicletarioData');
                return { clients: newClients, registros: newRegistros };
            } catch (error) {
                localStorage.removeItem('bicicletarioData');
            }
        }
        return null;
    }
};
