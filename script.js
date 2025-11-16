// --- 1. CONEXÃO COM O SUPABASE ---

// Substitua pela sua URL do Supabase
const SUPABASE_URL = 'https://apzzxcstmsbclrzcifsy.supabase.co'; 

// Substitua pela sua chave 'anon' (pública)
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFwenp4Y3N0bXNiY2xyemNpZnN5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMzMTI2NjQsImV4cCI6MjA3ODg4ODY2NH0.Qznh5In_rgu3hLVWJdHy2LVknoqiVvYpkRqdw_x2s2E';

// Cria o "cliente" - a nossa conexão com o backend
const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// --- 2. A PARTIR DAQUI, VOCÊ PODE USAR O LOGIN ---

// Exemplo de como um botão de login (que você vai criar no HTML) funcionaria:
/*
async function fazerLoginComEmail(email, senha) {
    const { data, error } = await supabase.auth.signInWithPassword({
        email: email,
        password: senha,
    });

    if (error) {
        console.error('Erro no login:', error.message);
    } else {
        console.log('Login com sucesso!', data.user);
        // O usuário está logado, agora podemos redirecionar
    }
}
*/
