const { app } = require('electron');
const fs = require('fs');
const path = require('path');

class StorageBackend {
  constructor() {
    this.userDataPath = app.getPath('userData');
    this.basePath = path.join(this.userDataPath, 'dados', 'desktop');
    this.clientesPath = path.join(this.basePath, 'clientes');
    this.registrosPath = path.join(this.basePath, 'registros');
    
    this.ensureDirectories();
  }

  ensureDirectories() {
    [this.basePath, this.clientesPath, this.registrosPath].forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });
  }

  sanitizeFilename(name) {
    return name.replace(/[^a-z0-9_-]/gi, '_');
  }

  saveClient(client) {
    try {
      const cpfLimpo = client.cpf.replace(/\D/g, '');
      const filename = `${cpfLimpo}.json`;
      const filepath = path.join(this.clientesPath, filename);
      
      fs.writeFileSync(filepath, JSON.stringify(client, null, 2), 'utf8');
      return { success: true, path: filepath };
    } catch (error) {
      console.error('Erro ao salvar cliente:', error);
      return { success: false, error: error.message };
    }
  }

  loadClient(cpf) {
    try {
      const cpfLimpo = cpf.replace(/\D/g, '');
      const filename = `${cpfLimpo}.json`;
      const filepath = path.join(this.clientesPath, filename);
      
      if (!fs.existsSync(filepath)) {
        return null;
      }
      
      const data = fs.readFileSync(filepath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      console.error('Erro ao carregar cliente:', error);
      return null;
    }
  }

  loadAllClients() {
    try {
      const files = fs.readdirSync(this.clientesPath);
      const clients = [];
      
      files.forEach(file => {
        if (file.endsWith('.json')) {
          const filepath = path.join(this.clientesPath, file);
          const data = fs.readFileSync(filepath, 'utf8');
          clients.push(JSON.parse(data));
        }
      });
      
      return clients;
    } catch (error) {
      console.error('Erro ao carregar clientes:', error);
      return [];
    }
  }

  deleteClient(cpf) {
    try {
      const cpfLimpo = cpf.replace(/\D/g, '');
      const filename = `${cpfLimpo}.json`;
      const filepath = path.join(this.clientesPath, filename);
      
      if (fs.existsSync(filepath)) {
        fs.unlinkSync(filepath);
        return { success: true };
      }
      
      return { success: false, error: 'Cliente não encontrado' };
    } catch (error) {
      console.error('Erro ao deletar cliente:', error);
      return { success: false, error: error.message };
    }
  }

  saveRegistro(registro) {
    try {
      const timestamp = registro.dataHoraEntrada || registro.entrada;
      if (!timestamp) {
        console.error('Registro sem data de entrada:', registro);
        return { success: false, error: 'Data de entrada não encontrada' };
      }
      
      const date = new Date(timestamp);
      if (isNaN(date.getTime())) {
        console.error('Data inválida:', timestamp);
        return { success: false, error: 'Data de entrada inválida' };
      }
      
      const ano = date.getFullYear();
      const mes = String(date.getMonth() + 1).padStart(2, '0');
      const dia = String(date.getDate()).padStart(2, '0');
      
      const anoPath = path.join(this.registrosPath, String(ano));
      const mesPath = path.join(anoPath, mes);
      
      if (!fs.existsSync(anoPath)) {
        fs.mkdirSync(anoPath, { recursive: true });
      }
      if (!fs.existsSync(mesPath)) {
        fs.mkdirSync(mesPath, { recursive: true });
      }
      
      const filename = `${dia}.json`;
      const filepath = path.join(mesPath, filename);
      
      let registros = [];
      if (fs.existsSync(filepath)) {
        const data = fs.readFileSync(filepath, 'utf8');
        registros = JSON.parse(data);
      }
      
      const index = registros.findIndex(r => r.id === registro.id);
      if (index >= 0) {
        registros[index] = registro;
      } else {
        registros.push(registro);
      }
      
      fs.writeFileSync(filepath, JSON.stringify(registros, null, 2), 'utf8');
      return { success: true, path: filepath };
    } catch (error) {
      console.error('Erro ao salvar registro:', error);
      return { success: false, error: error.message };
    }
  }

  loadRegistrosByDate(year, month, day) {
    try {
      const mesPath = path.join(this.registrosPath, String(year), String(month).padStart(2, '0'));
      const filename = `${String(day).padStart(2, '0')}.json`;
      const filepath = path.join(mesPath, filename);
      
      if (!fs.existsSync(filepath)) {
        return [];
      }
      
      const data = fs.readFileSync(filepath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      console.error('Erro ao carregar registros:', error);
      return [];
    }
  }

  loadAllRegistros() {
    try {
      const registros = [];
      
      if (!fs.existsSync(this.registrosPath)) {
        return registros;
      }
      
      const anos = fs.readdirSync(this.registrosPath);
      
      anos.forEach(ano => {
        const anoPath = path.join(this.registrosPath, ano);
        if (!fs.statSync(anoPath).isDirectory()) return;
        
        const meses = fs.readdirSync(anoPath);
        
        meses.forEach(mes => {
          const mesPath = path.join(anoPath, mes);
          if (!fs.statSync(mesPath).isDirectory()) return;
          
          const dias = fs.readdirSync(mesPath);
          
          dias.forEach(dia => {
            if (!dia.endsWith('.json')) return;
            
            const filepath = path.join(mesPath, dia);
            const data = fs.readFileSync(filepath, 'utf8');
            const registrosDia = JSON.parse(data);
            registros.push(...registrosDia);
          });
        });
      });
      
      return registros;
    } catch (error) {
      console.error('Erro ao carregar todos os registros:', error);
      return [];
    }
  }

  getOrganizedStructure() {
    try {
      const structure = {};
      
      if (!fs.existsSync(this.registrosPath)) {
        return structure;
      }
      
      const anos = fs.readdirSync(this.registrosPath);
      
      anos.forEach(ano => {
        const anoPath = path.join(this.registrosPath, ano);
        if (!fs.statSync(anoPath).isDirectory()) return;
        
        structure[ano] = {};
        const meses = fs.readdirSync(anoPath);
        
        meses.forEach(mes => {
          const mesPath = path.join(anoPath, mes);
          if (!fs.statSync(mesPath).isDirectory()) return;
          
          structure[ano][mes] = [];
          const dias = fs.readdirSync(mesPath);
          
          dias.forEach(dia => {
            if (!dia.endsWith('.json')) return;
            structure[ano][mes].push(dia.replace('.json', ''));
          });
        });
      });
      
      return structure;
    } catch (error) {
      console.error('Erro ao obter estrutura organizada:', error);
      return {};
    }
  }

  getStoragePath() {
    return this.basePath;
  }
}

module.exports = StorageBackend;
