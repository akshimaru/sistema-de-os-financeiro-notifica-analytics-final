import Swal from 'sweetalert2';
import { formatCurrency, formatDate } from './formatters';

export const alerts = {
  success: (message: string) => {
    return Swal.fire({
      title: 'Sucesso!',
      text: message,
      icon: 'success',
      confirmButtonText: 'OK',
      confirmButtonColor: '#8B5CF6',
      customClass: {
        popup: 'rounded-2xl',
        confirmButton: 'rounded-lg'
      }
    });
  },

  error: (message: string) => {
    return Swal.fire({
      title: 'Erro!',
      text: message,
      icon: 'error',
      confirmButtonText: 'OK',
      confirmButtonColor: '#8B5CF6',
      customClass: {
        popup: 'rounded-2xl',
        confirmButton: 'rounded-lg'
      }
    });
  },

  info: (message: string) => {
    return Swal.fire({
      title: 'Informação',
      text: message,
      icon: 'info',
      confirmButtonText: 'OK',
      confirmButtonColor: '#8B5CF6',
      customClass: {
        popup: 'rounded-2xl',
        confirmButton: 'rounded-lg'
      }
    });
  },

  confirm: (options: {
    title: string;
    text: string;
    icon?: 'warning' | 'error' | 'success' | 'info' | 'question';
    confirmButtonText?: string;
    cancelButtonText?: string;
  }) => {
    return Swal.fire({
      title: options.title,
      text: options.text,
      icon: options.icon || 'warning',
      showCancelButton: true,
      confirmButtonColor: '#8B5CF6',
      cancelButtonColor: '#d33',
      confirmButtonText: options.confirmButtonText || 'Sim',
      cancelButtonText: options.cancelButtonText || 'Cancelar',
      customClass: {
        popup: 'rounded-2xl',
        confirmButton: 'rounded-lg',
        cancelButton: 'rounded-lg'
      }
    });
  },

  orderDetails: (ordem: any) => {
    return Swal.fire({
      title: `Ordem #${ordem.numero}`,
      html: `<div class="text-left space-y-6">
        <div class="bg-purple-50/50 p-4 rounded-lg">
          <p class="font-semibold text-gray-800 mb-2">Informações do Cliente</p>
          <p class="text-gray-700 mb-1"><strong>Nome:</strong> ${ordem.cliente?.nome || 'N/A'}</p>
          <p class="text-gray-700 mb-1"><strong>Telefone:</strong> ${ordem.cliente?.telefone || 'N/A'}</p>
        </div>
        
        <div class="bg-blue-50/50 p-4 rounded-lg">
          <p class="font-semibold text-gray-800 mb-2">Informações do Instrumento</p>
          <p class="text-gray-700 mb-1"><strong>Instrumento:</strong> ${ordem.instrumento?.nome || 'N/A'}</p>
          <p class="text-gray-700 mb-1"><strong>Marca:</strong> ${ordem.marca?.nome || 'N/A'}</p>
          <p class="text-gray-700 mb-1"><strong>Modelo:</strong> ${ordem.modelo || 'N/A'}</p>
          <p class="text-gray-700 mb-1"><strong>Acessórios:</strong> ${ordem.acessorios || 'N/A'}</p>
        </div>
        
        <div class="bg-gray-50/50 p-4 rounded-lg">
          <div class="space-y-2">
            <div>
              <p class="text-gray-700"><strong>Observações Adicionais:</strong></p>
              <p class="text-gray-600 text-sm whitespace-pre-wrap">${ordem.observacoes || 'Nenhuma observação adicional.'}</p>
            </div>
          </div>
        </div>
      </div>`,
      icon: 'info',
      confirmButtonColor: '#8B5CF6',
      confirmButtonText: 'Fechar',
      width: '42rem',
      customClass: {
        popup: 'rounded-2xl',
        confirmButton: 'rounded-lg',
        htmlContainer: 'text-left'
      }
    });
  }
};