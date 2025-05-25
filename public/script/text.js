
function primeiraMaiusculaRestoMinusculo(t) {
  return t ? t.trim().charAt(0).toUpperCase() + t.trim().slice(1).toLowerCase() : '';
}

/* ============================================================================
   Reconhecimento de voz
============================================================================ */
let escutando = false;
let reconhecimento;
let parcialAnterior = '';
let cursorPosAnterior = null;

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

  reconhecimento.onresult = e => {
    const input = document.getElementById('texto');
    // Captura a posição do cursor ANTES de qualquer modificação
    if (document.activeElement === input) {
      cursorPosAnterior = input.selectionStart;
    } else if (cursorPosAnterior === null) {
      cursorPosAnterior = input.value.length; // fallback: insere no fim
    }

    let finalizado = "", parcialNovo = "";
    for (let i = e.resultIndex; i < e.results.length; i++) {
      const r = e.results[i];
      r.isFinal
        ? (finalizado += r[0].transcript)
        : (parcialNovo += r[0].transcript);
    }

    // Remove o parcial anterior da posição correta do input
    let texto = input.value;
    let pos = cursorPosAnterior;

    if (parcialAnterior) {
      // Remove o parcial anterior, mas só se estiver na posição certa
      if (
        texto.slice(pos - parcialAnterior.length, pos) === parcialAnterior
      ) {
        texto =
          texto.slice(0, pos - parcialAnterior.length) +
          texto.slice(pos);
        pos = pos - parcialAnterior.length;
      }
    }

    // Monta o texto a ser inserido
    const inserir =
      (finalizado ? finalizado.trimStart().toLowerCase() + " " : "") +
      (parcialNovo ? parcialNovo.trimStart().toLowerCase() : "");

    // Insere exatamente onde o cursor estava
    texto = texto.slice(0, pos) + inserir + texto.slice(pos);
    // Atualiza o campo
    input.value = texto;

    // Move o cursor para depois do texto inserido
    let novaPos = pos + inserir.length;
    input.setSelectionRange(novaPos, novaPos);

    // Guarda para a próxima iteração
    parcialAnterior = parcialNovo.trimStart().toLowerCase();
    cursorPosAnterior = novaPos;
  };

  reconhecimento.onerror = err => console.error('Reconhecimento:', err.error);
  reconhecimento.onend   = ()  => (escutando = false);

  reconhecimento.start();
  escutando = true;
}

let reconhecimentoAndroid;

let pararManual = false;



function iniciarEscutaAndroid() {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    alert('Seu navegador não suporta reconhecimento de voz.');
    return;
  }

  if (escutando) {
    console.log('Já está escutando.');
    return;
  }

  reconhecimentoAndroid = new SpeechRecognition();
  reconhecimentoAndroid.lang = 'pt-BR';
  reconhecimentoAndroid.interimResults = true;
  reconhecimentoAndroid.continuous = true;

  reconhecimentoAndroid.onstart = () => {
    escutando = true;
    pararManual = false;
    console.log('Reconhecimento iniciado');
  };

  reconhecimentoAndroid.onresult = (event) => {
    const textarea = document.querySelector('textarea');
    if (!textarea) return;

    let textoAtual = textarea.value;

    for (let i = event.resultIndex; i < event.results.length; i++) {
      const resultado = event.results[i];
      if (resultado.isFinal) {
        textoAtual += resultado[0].transcript + ' ';
      }
    }

    textarea.value = textoAtual.trim();
  };

  reconhecimentoAndroid.onerror = (event) => {
    console.error('Erro no reconhecimento de voz:', event.error);
  };

  reconhecimentoAndroid.onend = () => {
    escutando = false;
    console.log('Reconhecimento parado');
    if (!pararManual) {
      reconhecimentoAndroid.start();
    }
  };

  reconhecimentoAndroid.start();

  // Para automaticamente após 60 segundos
  setTimeout(() => {
    if (escutando) {
      pararEscutaAndroid();
      console.log('Parada automática após 60 segundos');
    }
  }, 60000);
}

function pararEscutaAndroid() {
  if (reconhecimentoAndroid && escutando) {
    pararManual = true;
    reconhecimentoAndroid.stop();
    console.log('Reconhecimento parado manualmente');
  }
}


function pararEscutaAndroid() {
  if (reconhecimentoAndroid && escutando) {
    pararManual = true;
    reconhecimentoAndroid.stop();
    console.log('Reconhecimento parado manualmente');
  }
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


function selecionarTexto() {
  const textarea = document.getElementById('texto');
  textarea.select();             // Seleciona todo o texto
  textarea.setSelectionRange(0, 99999); // Compatibilidade para dispositivos móveis
}



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

function isMobileOS() {
  const ua = navigator.userAgent || navigator.vendor || window.opera;

  if (/android/i.test(ua)) {
    return 'android';
  }

  if (/iPad|iPhone|iPod/.test(ua) && !window.MSStream) {
    return 'ios';
  }

  return 'other';
}

window.addEventListener('DOMContentLoaded', () => {
  const os = isMobileOS();

  const btnEscutarWindows = document.querySelector('button.fixa.windows');
  const btnEscutarAndroid = document.querySelector('button.fixa.android');
  const btnPararWindows = document.querySelector('button.naoFixa.windows');
  const btnPararAndroid = document.querySelector('button.naoFixa.android');

  if (os === 'android' || os === 'ios') {
    // Oculta botões Windows
    if (btnEscutarWindows) btnEscutarWindows.style.display = 'none';
    if (btnPararWindows) btnPararWindows.style.display = 'none';

    // Mostra botões Android/iOS
    if (btnEscutarAndroid) btnEscutarAndroid.style.display = 'flex';
    if (btnPararAndroid) btnPararAndroid.style.display = 'flex';

    // Adiciona classe mobile-os para estilos específicos
    document.body.classList.add('mobile-os');
  } else {
    // Desktop ou outros: mostra Windows, oculta Android
    if (btnEscutarWindows) btnEscutarWindows.style.display = 'flex';
    if (btnPararWindows) btnPararWindows.style.display = 'flex';

    if (btnEscutarAndroid) btnEscutarAndroid.style.display = 'none';
    if (btnPararAndroid) btnPararAndroid.style.display = 'none';
  }
});



