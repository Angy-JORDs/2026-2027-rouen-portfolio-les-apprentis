/**
 * Pictogrammes du site, tous issus de React Icons (https://react-icons.github.io/react-icons/) :
 * famille Lucide (lu) au trait fin pour l'interface, Font Awesome 6 (fa6) pour les logos de marques.
 * Couleur héritée (currentColor) ; décoratifs, donc masqués aux lecteurs d'écran.
 */
import {
  LuArrowLeft,
  LuArrowRight,
  LuBriefcaseBusiness,
  LuChevronUp,
  LuDownload,
  LuExternalLink,
  LuFileUser,
  LuFolderCode,
  LuGraduationCap,
  LuHandHeart,
  LuLanguages,
  LuMail,
  LuMenu,
  LuMessageCircleQuestion,
  LuWrench,
  LuX,
} from 'react-icons/lu'
import { FaGithub, FaLinkedin } from 'react-icons/fa6'

const deco = (Icon) => {
  const Decorative = (props) => <Icon aria-hidden="true" focusable="false" {...props} />
  return Decorative
}

/* ------------------------------------------------------------ objets de la scène (un par section) */
export const FormationIcon = deco(LuGraduationCap) // Formation : toque de diplômé
export const ExperiencesIcon = deco(LuBriefcaseBusiness) // Expériences : mallette professionnelle
export const CompetencesIcon = deco(LuWrench) // Compétences : outils maîtrisés
export const ProjetsIcon = deco(LuFolderCode) // Projets : dossier de code
export const AssociatifIcon = deco(LuHandHeart) // Associatif : engagement bénévole
export const LanguesIcon = deco(LuLanguages) // Langues : symbole de traduction
export const ContactIcon = deco(LuMail) // Contact : courrier

/* ------------------------------------------------------------ interface */
export const ArrowLeftIcon = deco(LuArrowLeft)
export const ArrowRightIcon = deco(LuArrowRight)
export const CloseIcon = deco(LuX)
export const MenuIcon = deco(LuMenu)
export const ExternalIcon = deco(LuExternalLink)
export const CvIcon = deco(LuFileUser)
export const DownloadIcon = deco(LuDownload)
export const FaqIcon = deco(LuMessageCircleQuestion)
export const ChevronUpIcon = deco(LuChevronUp)

/* ------------------------------------------------------------ marques */
export const GithubIcon = deco(FaGithub)
export const LinkedinIcon = deco(FaLinkedin)
