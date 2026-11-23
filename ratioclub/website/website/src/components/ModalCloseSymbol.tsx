/** X that spins and morphs to Figma's 24px ratio symbol on hover; the surrounding button retains its Close label. */
export function ModalCloseSymbol(){
 return <span className="modal-close-symbol" aria-hidden="true"><span className="modal-close-symbol-bar"/><span className="modal-close-symbol-dot modal-close-symbol-dot--first"/><span className="modal-close-symbol-dot modal-close-symbol-dot--second"/></span>;
}
