const axios = require('axios');
const nodemailer = require('nodemailer');

// Substitua com seu token de acesso real
const TOKEN = '65845a7718b00800182f98cf';

// Configurar o transporter do Nodemailer
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'yagoapp2014@gmail.com',
    pass: 'fu163svh' // Use uma senha de aplicativo, não sua senha normal do Gmail
  }
});

// Função para verificar a validade do token
async function checkTokenValidity() {
  const options = {
    method: 'GET',
    headers: {
      accept: 'application/json',
      Authorization: `Bearer ${TOKEN}`
    }
  };

  try {
    const response = await fetch('https://crm.rdstation.com/api/v1/token/check', options);
    const data = await response.json();
    console.log('Verificação do token:', data);
    return data.valid;
  } catch (err) {
    console.error('Erro ao verificar o token:', err);
    return false;
  }
}

// Função para buscar novas negociações
async function checkForNewDeals() {
  try {
    // Primeiro, verificar a validade do token
    const isTokenValid = await checkTokenValidity();
    if (!isTokenValid) {
      console.error('Token inválido. Por favor, verifique suas credenciais.');
      return;
    }

    const response = await axios.get('https://crm.rdstation.com/api/v1/deals', {
      headers: {
        'Authorization': `Bearer ${TOKEN}`,
        'Content-Type': 'application/json'
      },
      params: {
        'created_at[start]': new Date(Date.now() - 24*60*60*1000).toISOString()
      }
    });

    const newDeals = response.data.deals;

    newDeals.forEach(deal => {
      console.log(`Nova negociação: ${deal.name} - R$ ${deal.amount}`);
      enviarNotificacao(deal.name, deal.amount, deal.deal_pipeline.name);
    });

  } catch (error) {
    console.error('Erro ao buscar negociações:', error.message);
    if (error.response) {
      console.error('Detalhes do erro:', error.response.data);
    }
  }
}

function enviarNotificacao(dealName, dealValue, funnelName) {
  const mailOptions = {
    from: 'yagoapp2014@gmail.com',
    to: 'yagoapp2013@gmail.com',
    subject: 'Nova Negociação Criada no RD Station CRM',
    text: `
      Nova negociação criada:
      Nome: ${dealName}
      Valor: R$ ${dealValue}
      Funil: ${funnelName}
    `
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.log('Erro ao enviar e-mail:', error);
    } else {
      console.log('E-mail enviado:', info.response);
    }
  });
  
  console.log('Enviando notificação...');
  console.log(`Nova negociação: ${dealName} - R$ ${dealValue} no funil ${funnelName}`);
}

// Executar a verificação a cada 5 minutos
setInterval(checkForNewDeals, 5 * 60 * 1000);

// Executar imediatamente na inicialização
checkForNewDeals();