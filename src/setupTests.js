import { TextEncoder, TextDecoder } from 'util';

// React Router's browser build expects the encoding APIs supplied by browsers.
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;
global.IS_REACT_ACT_ENVIRONMENT = true;
