/**
 * Normaliza número de telefone para formato E.164 (+55DDDNUMBER)
 */
export function normalizePhone(phone: string): string {
  // Remove todos os caracteres não numéricos
  const cleaned = phone.replace(/\D/g, '');
  
  // Se já começa com 55, assume que está correto
  if (cleaned.startsWith('55')) {
    return `+${cleaned}`;
  }
  
  // Se tem 11 dígitos (celular com DDD), adiciona +55
  if (cleaned.length === 11) {
    return `+55${cleaned}`;
  }
  
  // Se tem 10 dígitos (telefone fixo com DDD), adiciona +55
  if (cleaned.length === 10) {
    return `+55${cleaned}`;
  }
  
  // Caso contrário, retorna como está (com +)
  return cleaned.startsWith('+') ? cleaned : `+${cleaned}`;
}

/**
 * Valida se um número de telefone é válido para WhatsApp
 */
export function isValidWhatsAppNumber(phone: string): boolean {
  const normalized = normalizePhone(phone);
  // Número brasileiro válido: +55 + DDD (2 dígitos) + número (8 ou 9 dígitos)
  return /^\+55\d{10,11}$/.test(normalized);
}

/**
 * Abre conversa no WhatsApp com mensagem pré-preenchida
 */
export function openWhatsApp(phone: string, message: string = ''): void {
  const normalized = normalizePhone(phone);
  const encodedMessage = encodeURIComponent(message);
  const url = `https://wa.me/${normalized.replace('+', '')}${message ? `?text=${encodedMessage}` : ''}`;
  window.open(url, '_blank');
}

/**
 * Gera mensagem padrão de confirmação de agendamento
 */
export function getAppointmentMessage(
  clientName: string,
  date: string,
  time: string,
  serviceName: string
): string {
  return `Olá, ${clientName}! 👋\n\nSeu agendamento está confirmado:\n📅 Data: ${date}\n⏰ Horário: ${time}\n💅 Serviço: ${serviceName}\n\nQualquer dúvida, estamos à disposição!`;
}
