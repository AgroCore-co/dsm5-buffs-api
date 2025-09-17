// Arquivo de teste para verificar se a autenticação está funcionando
// Execute: node test-auth.js

const BASE_URL = 'http://localhost:3001';

async function testAPI() {
  console.log('🧪 Testando API de Autenticação...\n');

  try {
    // 1. Testar health check
    console.log('1️⃣ Testando health check...');
    const healthResponse = await fetch(`${BASE_URL}/health`);
    const healthData = await healthResponse.json();
    console.log('✅ Health:', healthData);
    console.log('');

    // 2. Testar signup
    console.log('2️⃣ Testando signup...');
    const signupData = {
      email: `teste.${Date.now()}@example.com`,
      password: 'minhasenha123',
      nome: 'Usuário Teste',
      telefone: '11999999999'
    };

    const signupResponse = await fetch(`${BASE_URL}/auth/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(signupData),
    });

    const signupResult = await signupResponse.json();
    console.log('📝 Signup response:', signupResult);

    if (!signupResponse.ok) {
      console.log('❌ Signup falhou:', signupResult);
      return;
    }

    console.log('✅ Signup realizado com sucesso!');
    console.log('📧 Verifique o email para confirmar a conta antes de fazer login.');
    console.log('');

    // 3. Testar signin (provavelmente falhará se email não foi confirmado)
    console.log('3️⃣ Testando signin...');
    const signinResponse = await fetch(`${BASE_URL}/auth/signin`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: signupData.email,
        password: signupData.password,
      }),
    });

    const signinResult = await signinResponse.json();
    console.log('🔑 Signin response:', signinResult);

    if (signinResponse.ok && signinResult.access_token) {
      console.log('✅ Login realizado com sucesso!');
      console.log('🎫 Token de acesso:', signinResult.access_token.substring(0, 50) + '...');
      
      // 4. Testar endpoint protegido
      console.log('');
      console.log('4️⃣ Testando endpoint protegido...');
      const profileResponse = await fetch(`${BASE_URL}/usuarios/me`, {
        headers: {
          'Authorization': `Bearer ${signinResult.access_token}`,
        },
      });

      const profileResult = await profileResponse.json();
      console.log('👤 Profile response:', profileResult);

    } else {
      console.log('❌ Login falhou (provável: email não confirmado):', signinResult);
      console.log('💡 Para testar completamente, confirme o email e execute novamente.');
    }

  } catch (error) {
    console.error('💥 Erro durante os testes:', error.message);
  }
}

// Executar testes
testAPI();
