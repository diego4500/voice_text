// controller.js
// -----------------------------------------------------------------------------
// Faz chamadas à OpenAI (chat completions) para Correção e Melhoria de texto
// -----------------------------------------------------------------------------
import 'dotenv/config';
import fetch from 'node-fetch';

/**
 * Helper DRY para acessar o endpoint de chat da OpenAI.
 * @param {string} promptSystem  – mensagem “system”
 * @param {string} promptUser    – mensagem “user”
 * @param {number} temperature   – criatividade da resposta
 * @returns {Promise<string>}    – texto retornado pelo modelo
 */
async function chamarOpenAI(promptSystem, promptUser, temperature = 0.3) {
  const resp = await fetch('https://api.openai.com/v1/chat/completions', {
    method : 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization : `Bearer ${process.env.OPENAI_KEY}`
    },
    body: JSON.stringify({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: promptSystem },
        { role: 'user',   content: promptUser   }
      ],
      temperature
    })
  });

  const data = await resp.json();
  if (data.choices?.[0]?.message?.content) {
    return data.choices[0].message.content.trim();
  }
  throw new Error(JSON.stringify(data)); // deixa o caller tratar
}

/* ---------------------------------------------------------------------------
   POST /api/corrigir-texto
--------------------------------------------------------------------------- */
export async function corrigirTexto(req, res) {
  const { texto } = req.body;
  if (!texto) return res.status(400).json({ erro: 'Texto é obrigatório' });

  try {
    const textoCorrigido = await chamarOpenAI(
      'Você é um assistente que corrige ortografia e gramática de textos em português. Não coloque aspas e use maiúsculas apenas no início das frases.',
      `Corrija o seguinte texto:\n\n"${texto}"`,
      0.2
    );
    res.json({ textoCorrigido });
  } catch (e) {
    res.status(500).json({ erro: 'Falha na OpenAI', detalhe: e.message });
  }
}

/* ---------------------------------------------------------------------------
   POST /api/melhorar-texto
--------------------------------------------------------------------------- */
export async function melhorarTexto(req, res) {
  const { texto, prompt } = req.body;
  if (!texto) return res.status(400).json({ erro: 'Texto é obrigatório' });

  const promptUser = `${
    prompt ||
    'Faça alterações no texto, pode mudar palavras se precisar, deixando uma boa gramática, concordância e ortografia, sem perder o sentido real da frase.'
  }\n\n${texto}`;

  try {
    const textoMelhorado = await chamarOpenAI(
      'Você é um assistente que melhora textos em português, aprimorando gramática, ortografia e estilo, mas mantendo o sentido original.',
      promptUser,
      0.35
    );
    res.json({ textoMelhorado });
  } catch (e) {
    res.status(500).json({ erro: 'Falha na OpenAI', detalhe: e.message });
  }
}
