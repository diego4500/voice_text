
function primeiraMaiusculaRestoMinusculo(t) {
  return t ? t.trim().charAt(0).toUpperCase() + t.trim().slice(1).toLowerCase() : '';
}

/* ============================================================================
   Reconhecimento de voz
============================================================================ */
let escutando = false;
let reconhecimento;

function iniciarEscuta() {
  if (escutando) return;

  const SpeechRecognition =
    window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    alert('Seu navegador não suporta reconhecimento de voz.');
    return;
  }

  reconhecimento = new SpeechRecognition();
  reconhecimento.lang = 'pt-BR';
  reconhecimento.interimResults = true;
  reconhecimento.continuous = true;

  let parcialAnterior = '';   // guarda o último interim já renderizado

  reconhecimento.onresult = e => {
    const input   = document.getElementById('texto');
    let cursorPos = input.selectionStart ?? input.value.length;

    /* 1. Remove o parcial anterior que ainda estava visível */
    if (parcialAnterior) {
      const antes  = input.value.slice(0, cursorPos - parcialAnterior.length);
      const depois = input.value.slice(cursorPos);
      input.value  = antes + depois;
      cursorPos    = antes.length;
      parcialAnterior = '';
    }

    /* 2. Separa final (pausa) e novo parcial */
    let finalizado = '', parcialNovo = '';
    for (let i = e.resultIndex; i < e.results.length; i++) {
      const r = e.results[i];
      r.isFinal ? (finalizado += r[0].transcript)        // sem espaço/trim
                : (parcialNovo += r[0].transcript);
    }

    /* 3. Transforma: não capitaliza, garante 1 espaço após a pausa */
    const textoFinal = finalizado
      ? finalizado.trimStart().toLowerCase() + ' '       // tudo minúsculo
      : '';                                              // se não houve pausa

    const textoParcial = parcialNovo
      ? parcialNovo.trimStart().toLowerCase()            // também minúsculo
      : '';

    const inserir = textoFinal + textoParcial;

    /* 4. Insere na posição atual do cursor */
    const antes  = input.value.slice(0, cursorPos);
    const depois = input.value.slice(cursorPos);
    input.value  = antes + inserir + depois;

    const novaPos = antes.length + inserir.length;
    input.setSelectionRange(novaPos, novaPos);

    /* 5. Guarda apenas o novo parcial para remover depois */
    parcialAnterior = textoParcial;
  };

  reconhecimento.onerror = err => console.error('Reconhecimento:', err.error);
  reconhecimento.onend   = ()  => (escutando = false);

  reconhecimento.start();
  escutando = true;
}






function pararEEscrever() {
  if (reconhecimento && escutando) reconhecimento.stop();
}

/* ============================================================================
   Google Texto-To-Speech
============================================================================ */
async function lerTexto() {
  const input = document.getElementById('texto');
  const trecho = (input.value.substring(input.selectionStart, input.selectionEnd) || input.value).trim();
  if (!trecho) return alert('Digite ou selecione um texto.');

  const resp = await fetch('https://texttospeech.googleapis.com/v1/text:synthesize?key=AIzaSyA6lbTmDyfZSeLjiTina3KArogaDB6jgk8', {
    method : 'POST',
    headers: { 'Content-Type': 'application/json' },
    body   : JSON.stringify({
      input : { text: trecho },
      voice : { languageCode: 'pt-BR', name: 'pt-BR-Chirp3-HD-Zephyr', ssmlGender: 'FEMALE' },
      audioConfig: { audioEncoding: 'MP3' }
    })
  });

  const dados = await resp.json();
  if (dados.audioContent) new Audio(`data:audio/mp3;base64,${dados.audioContent}`).play();
  else                    alert('Erro ao gerar áudio.');
}


async function corrigirTexto()  { await processarTrecho('/api/corrigir-texto', 'textoCorrigido'); }
async function melhorarTexto()  { await processarTrecho('/api/melhorar-texto', 'textoMelhorado'); }

async function processarTrecho(endpoint, campoRet) {
  const input = document.getElementById('texto');
  const { selectionStart: s, selectionEnd: e, value } = input;
  const trecho = value.substring(s, e).trim();
  if (!trecho) return alert('Selecione um trecho do texto primeiro.');

  const resp  = await fetch(endpoint, {
    method : 'POST',
    headers: { 'Content-Type': 'application/json' },
    body   : JSON.stringify({ texto: trecho })
  });
  const dados = await resp.json();

  dados[campoRet] ? input.setRangeText(dados[campoRet], s, e, 'select')
                  : alert('Erro ao processar texto.');
}

/* ============================================================================
  Copiar texto
============================================================================ */
async function copiarTexto() {
  const texto = document.getElementById('texto').value;
  try {
    await navigator.clipboard.writeText(texto);
  } catch {
    document.getElementById('texto').select();
    document.execCommand('copy'); // fallback legacy
  }
}

function limparTexto() {
  document.getElementById('texto').value = '';
}


document.querySelectorAll('.botoes button').forEach(btn => {
  btn.addEventListener('mousedown', e => e.preventDefault());
});

/* ------------------------------------------------------------------
   Fixar / desafixar botões .fixa após o clique
------------------------------------------------------------------*/
document.querySelectorAll('.fixa').forEach(btn => {
  btn.addEventListener('click', e => {
    e.stopPropagation();           // evita que o clique chegue ao <body>
    btn.classList.toggle('ativo'); // alterna o estado fixo
  });
});

// Remove o estado "ativo" ao clicar fora
document.addEventListener('click', () => {
  document.querySelectorAll('.fixa.ativo')
          .forEach(b => b.classList.remove('ativo'));
});
