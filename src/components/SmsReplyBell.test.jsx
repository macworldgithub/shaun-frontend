import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { SmsReplyBell } from './SmsReplyBell';
import { smsReplyApi } from '../lib/api';
jest.mock('../lib/api',()=>({smsReplyApi:{list:jest.fn(),conversation:jest.fn(),read:jest.fn(),send:jest.fn()}}));
let container,root;
const notice={id:'notification-id',sender_name:'Reply Customer',preview:'Can we collect tomorrow?',phone:'+61499918523',site_name:'BYD Fairfield',sent_at:'2026-11-12T10:00:00Z',read:false};
const unread={items:[notice],unread_count:1,has_more:false,next_offset:20};
const cleared={items:[],unread_count:0,has_more:false,next_offset:20};
const thread={recipient:{phone:notice.phone,site:notice.site_name,client_id:'client-id',name:notice.sender_name},messages:[{id:'provider-inbound',body:notice.preview,direction:'inbound',sent_at:notice.sent_at}]};
const button=text=>[...container.querySelectorAll('button')].find(b=>b.textContent.includes(text));
const click=async el=>act(async()=>{el.dispatchEvent(new MouseEvent('click',{bubbles:true}));});
beforeEach(()=>{global.IS_REACT_ACT_ENVIRONMENT=true;container=document.createElement('div');document.body.appendChild(container);root=createRoot(container);jest.clearAllMocks();smsReplyApi.list.mockResolvedValue(unread);smsReplyApi.conversation.mockResolvedValue(thread);smsReplyApi.read.mockResolvedValue({});smsReplyApi.send.mockResolvedValue({});});
afterEach(async()=>{await act(async()=>root.unmount());container.remove();jest.useRealTimers();});
async function render(scope='BYD Fairfield'){await act(async()=>{root.render(<SmsReplyBell scope={scope}/>);});}
test('real unread count, customer preview and timestamp open the correct conversation and persist viewed IDs',async()=>{
 await render();expect(container.querySelector('[data-testid="sms-unread-count"]').textContent).toBe('1');
 await click(container.querySelector('[aria-label^="Notifications"]'));expect(container.textContent).toContain(notice.preview);expect(container.textContent).toContain('BYD Fairfield');
 smsReplyApi.read.mockImplementation(async()=>{smsReplyApi.list.mockResolvedValue(cleared);});
 await click(button('Open conversation'));expect(smsReplyApi.conversation).toHaveBeenCalledWith(notice.id);expect(smsReplyApi.read).toHaveBeenCalledWith(notice.id,['provider-inbound']);
 expect(container.querySelector('[role="dialog"]').textContent).toContain(notice.preview);expect(container.querySelector('[data-testid="sms-unread-count"]')).toBeNull();
});
test('failed conversation loads do not silently mark a reply as read',async()=>{
 await render();await click(container.querySelector('[aria-label^="Notifications"]'));smsReplyApi.conversation.mockRejectedValue(new Error('Connection failed'));
 await click(button('Open conversation'));expect(smsReplyApi.read).not.toHaveBeenCalled();expect(container.querySelector('[role="alert"]').textContent).toContain('Connection failed');
});
test('manual SMS reply retains text on failure and uses the verified phone and site on success',async()=>{
 await render();await click(container.querySelector('[aria-label^="Notifications"]'));await click(button('Open conversation'));
 const textarea=container.querySelector('textarea');await act(async()=>{Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype,'value').set.call(textarea,'Yes, please confirm a time.');textarea.dispatchEvent(new Event('input',{bubbles:true}));});
 smsReplyApi.send.mockRejectedValueOnce(new Error('Gateway unavailable'));
 await act(async()=>{container.querySelector('form').dispatchEvent(new Event('submit',{bubbles:true,cancelable:true}));});
 expect(textarea.value).toBe('Yes, please confirm a time.');expect(container.querySelector('[role="alert"]').textContent).toContain('Gateway unavailable');
 await act(async()=>{container.querySelector('form').dispatchEvent(new Event('submit',{bubbles:true,cancelable:true}));});
 expect(smsReplyApi.send).toHaveBeenCalledWith({...thread.recipient,body:'Yes, please confirm a time.'});expect(textarea.value).toBe('');
});
test('reply polling updates badges without reload and does not repeatedly acknowledge unchanged messages',async()=>{
 jest.useFakeTimers();smsReplyApi.list.mockResolvedValue(cleared);await render();expect(container.querySelector('[data-testid="sms-unread-count"]')).toBeNull();
 smsReplyApi.list.mockResolvedValue(unread);await act(async()=>{jest.advanceTimersByTime(10000);});expect(container.querySelector('[data-testid="sms-unread-count"]').textContent).toBe('1');
 await click(container.querySelector('[aria-label^="Notifications"]'));await click(button('Open conversation'));expect(smsReplyApi.read).toHaveBeenCalledTimes(1);
 await act(async()=>{jest.advanceTimersByTime(5000);});expect(smsReplyApi.read).toHaveBeenCalledTimes(1);
});
test('site switching closes customer previews and clears previous-site data while the next scope loads',async()=>{
 await render();await click(container.querySelector('[aria-label^="Notifications"]'));await click(button('Open conversation'));
 smsReplyApi.list.mockResolvedValue(cleared);await render('BYD Nunawading');expect(container.querySelector('[role="dialog"]')).toBeNull();expect(container.textContent).not.toContain(notice.sender_name);
 expect(smsReplyApi.list).toHaveBeenCalledWith('BYD Nunawading',false,0);
});
