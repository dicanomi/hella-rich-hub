import {SiteRouteContext} from './SiteRouteContext';
import {sitePath} from "../config/paths";
import { useState, useRef, useEffect, useContext } from "react";
import { HeaderLogo } from "./HeaderLogo";
import rightArrow from "../assets/arrow-right-desktop.svg";
import mobileRightArrow from "../assets/arrow-right-mobile.svg";
import externalArrow from "../assets/arrow-external-desktop.svg";
import mobileExternalArrow from "../assets/arrow-external-mobile.svg";
import { primaryNavigationItems } from "../content/index";
import {openContactEvent} from './contact-modal-events';
import './legal-navigation.css';

export function Header() {
  const path=useContext(SiteRouteContext);
  const [open, setOpen] = useState(false);
  const trigger = useRef<HTMLButtonElement>(null);
  const header = useRef<HTMLElement>(null);
  useEffect(()=>{
    const desktop=matchMedia('(min-width:769px)');
    const closeOnDesktop=()=>{if(desktop.matches)setOpen(false);};
    closeOnDesktop();desktop.addEventListener('change',closeOnDesktop);
    return()=>desktop.removeEventListener('change',closeOnDesktop);
  },[]);

  useEffect(()=>{
    const element=header.current;
    if(!element)return;
    const hero=element.closest('.hero-surface')??element.closest('.solutions-page,.about-page')?.querySelector('.subpage-hero-surface');
    if(!hero)return;
    const measure=()=>element.style.setProperty('--open-nav-height',`${hero.getBoundingClientRect().bottom-element.getBoundingClientRect().top}px`);
    element.setAttribute('data-hero-menu','');
    measure();
    const observer=new ResizeObserver(measure);
    observer.observe(hero);observer.observe(element);
    window.addEventListener('resize',measure);
    return()=>{observer.disconnect();window.removeEventListener('resize',measure);element.removeAttribute('data-hero-menu');element.style.removeProperty('--open-nav-height');};
  },[]);
  useEffect(()=>{const closeForContact=()=>setOpen(false);window.addEventListener(openContactEvent,closeForContact);return()=>window.removeEventListener(openContactEvent,closeForContact);},[]);
  function closeMenu() {
    setOpen(false);
    trigger.current?.focus({preventScroll:true});
  }
  useEffect(() => {
    if (!open) return;
    const escape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        trigger.current?.focus({preventScroll:true});
      }
    };
    const outside = (event: PointerEvent) => {
      const element=header.current;
      if(!element||!(event.target instanceof Node))return;
      if(matchMedia('(min-width:601px) and (hover:hover) and (pointer:fine)').matches && event.pointerType==='mouse'){
        // The active zone includes the top links, close control and link stack,
        // plus breathing room between them; the full-width backdrop is outside.
        const controls=[...element.querySelectorAll<HTMLElement>('.header-links,.menu-toggle,.expanded-navigation .navigation-button')];
        const bounds=controls.map(control=>control.getBoundingClientRect()).filter(rect=>rect.width&&rect.height);
        if(!bounds.length)return;
        const padding=24;
        const inside=event.clientX>=Math.min(...bounds.map(r=>r.left))-padding &&
          event.clientX<=Math.max(...bounds.map(r=>r.right))+padding &&
          event.clientY>=Math.min(...bounds.map(r=>r.top))-padding &&
          event.clientY<=Math.max(...bounds.map(r=>r.bottom))+padding;
        if(!inside)setOpen(false);
      }else if(!element.contains(event.target))setOpen(false);
    };
    document.addEventListener("keydown", escape);
    document.addEventListener("pointerdown", outside);
    return () => {
      document.removeEventListener("keydown", escape);
      document.removeEventListener("pointerdown", outside);
    };
  }, [open]);
  return (
    <header
      ref={header}
      className={`site-header${open ? " site-header--open" : ""}`}
      onKeyDown={(event) => {
        if (event.key === "Escape" && open) {
          event.preventDefault();
          closeMenu();
        }
      }}
    >
      <div className="header-row">
        <HeaderLogo />
        <nav className="header-links" aria-label="Main navigation">
          <a href={sitePath("/solutions")} aria-current={path === "/solutions" ? "page" : undefined}>Solutions</a>
          <a href={sitePath("/about")} aria-current={path === "/about" ? "page" : undefined}>About us</a>
        </nav>
        <button
          ref={trigger}
          className="menu-toggle"
          type="button"
          aria-expanded={open}
          aria-controls="expanded-navigation"
          aria-label={open ? "Close navigation" : "Open navigation"}
          onClick={() => {
            setOpen(!open);
            trigger.current?.focus({preventScroll:true});
          }}
        >
          <span className="menu-toggle-icon" aria-hidden="true">
            <span className="menu-toggle-bar" />
            <span className="menu-toggle-bar" />
          </span>
        </button>
      </div>
      <div className="navigation-viewport">
        <nav
          id="expanded-navigation"
          className="expanded-navigation"
          aria-label="Additional navigation"
          aria-hidden={!open}
          inert={!open}
        >
          <ul>
            {primaryNavigationItems.map((item) => (
              <li key={item.label}>
                  <a
                    className="navigation-button"
                    href={sitePath(item.path)}
                    target={item.external?'_blank':undefined}
                    rel={item.external?'noopener noreferrer':undefined}
                    data-contact-modal={item.path==='/contact'?true:undefined}
                    aria-haspopup={item.path==='/contact'?'dialog':undefined}
                    onClick={closeMenu}
                  >
                    {item.label}
                    <picture>
                      <source
                        media="(max-width: 48rem)"
                        srcSet={item.external?mobileExternalArrow:mobileRightArrow}
                      />
                      <img draggable={false} src={item.external?externalArrow:rightArrow} alt="" />
                    </picture>
                  </a>

              </li>
            ))}
          </ul>
        </nav>
      </div>
    </header>
  );
}
