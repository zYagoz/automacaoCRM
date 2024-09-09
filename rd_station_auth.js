const axios = require('axios');
const fs = require('fs').promises;

// Substitua com seu token de acesso real
const TOKEN = '65845a7718b00800182f98cf';
const LAST_CHECK_FILE = 'last_check.json';

// Função para filtrar e organizar os dados da negociação
function filterDealData(deal) {
  return {
    nome_da_negociacao: deal.name || 'Não especificado',
    nome_do_funil: deal.deal_stage?.name || 'Não especificado',
    etapa_do_funil: deal.deal_stage?.nickname || 'Não especificada',
    id_da_negociacao: deal.id,
    created_at: deal.created_at,
    organizacao: {
      name: deal.organization?.name || 'Não especificado'
    },
    contato: deal.contacts.map(contact => ({
      name: contact.name || 'Não especificado',
      title: contact.title || 'Não especificado',
      phones: contact.phones || [],
      emails: contact.emails || []
    }))[0] || {}
  };
}

// Função para ler a data da última verificação
async function getLastCheckDate() {
  try {
    const data = await fs.readFile(LAST_CHECK_FILE, 'utf8');
    return JSON.parse(data).lastCheck;
  } catch (error) {
    // Se o arquivo não existir ou houver erro, retorna uma data antiga
    return new Date(0).toISOString();
  }
}

// Função para salvar a data da última verificação
async function saveLastCheckDate(date) {
  await fs.writeFile(LAST_CHECK_FILE, JSON.stringify({ lastCheck: date }));
}

// Função para buscar novas negociações do RD Station CRM
async function fetchNewDeals() {
  try {
    const lastCheckDate = await getLastCheckDate();
    const response = await axios.get(`https://crm.rdstation.com/api/v1/deals`, {
      params: {
        token: TOKEN,
        'created_at[start]': lastCheckDate,
        limit: 100,
        sort: 'created_at'
      }
    });

    const newDeals = response.data.deals.filter(deal => new Date(deal.created_at) > new Date(lastCheckDate));
    const filteredDeals = newDeals.map(filterDealData);

    if (newDeals.length > 0) {
      // Atualiza a data da última verificação com a data de criação da negociação mais recente
      const mostRecentDealDate = newDeals[newDeals.length - 1].created_at;
      await saveLastCheckDate(mostRecentDealDate);
    }

    console.log(`Novas negociações encontradas: ${filteredDeals.length}`);
    console.log('Negociações filtradas:', JSON.stringify(filteredDeals, null, 2));

    return filteredDeals;
  } catch (error) {
    console.error('Erro ao buscar novas negociações:', error.message);
    if (error.response) {
      console.error('Detalhes do erro:', error.response.data);
      console.error('Status do erro:', error.response.status);
    }
    return null;
  }
}

// Função para verificar novas negociações periodicamente
async function checkForNewDeals() {
  console.log('Verificando novas negociações...');
  const newDeals = await fetchNewDeals();
  if (newDeals && newDeals.length > 0) {
    console.log(`${newDeals.length} nova(s) negociação(ões) encontrada(s)!`);
    newDeals.forEach(deal => {
      console.log(`Nova negociação: ${deal.nome_da_negociacao} (ID: ${deal.id_da_negociacao})`);
      // Aqui você pode adicionar sua lógica de notificação
    });
  } else {
    console.log('Nenhuma nova negociação encontrada.');
  }
}

// Executar a verificação imediatamente e depois a cada 5 minutos
checkForNewDeals();
setInterval(checkForNewDeals, 1 * 60 * 1000);