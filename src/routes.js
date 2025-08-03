// -----------------------------------------------------------------------------
// Este arquivo centraliza as rotas relacionadas a operações de texto.
//
//  • POST /api/corrigir-texto
//      → Chama o controlador `corrigirTexto` para corrigir ortografia/gramática.
//
//  • POST /api/melhorar-texto
//      → Chama o controlador `melhorarTexto` para reescrever o texto
//        aprimorando gramática, estilo e fluidez, mantendo o sentido.
// -----------------------------------------------------------------------------
//
import { Router } from 'express';
import { corrigirTexto, melhorarTexto } from './controller.js';

const router = Router();

router.post('/corrigir-texto', corrigirTexto);
router.post('/melhorar-texto', melhorarTexto);

export default router;
