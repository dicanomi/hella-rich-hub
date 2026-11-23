export const openContactEvent='ratioclub:open-contact';
export function openContactModal(opener:HTMLElement){
 window.dispatchEvent(new CustomEvent(openContactEvent,{detail:opener}));
}
