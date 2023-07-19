import { Router } from 'express';
import { completion } from '../controllers/completion.controller';

const router = new Router();

router.post('/completions', completion);

export default router;
