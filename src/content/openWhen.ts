import type { OpenWhen } from './types';
import { content } from '../client';
import * as d from '../client/defaults';

/** "פתח/י כש…" Each card opens one piece the admin prepared. */
export const openWhen: OpenWhen[] = content.openWhen?.length ? content.openWhen : d.openWhen;
