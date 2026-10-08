import type { StrengthState } from './types';
import { content } from '../client';
import * as d from '../client/defaults';

/** "I need strength": one response a day per mood, "עוד אחד" cycles. */
export const strengthStates: StrengthState[] = content.strength?.length ? content.strength : d.strength;
