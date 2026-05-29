// Shared pharma category icon mapping
// Used by CategoriesCarousel, CategoryGrid, PharmaHomeSections

import {
  GiHeartOrgan,
  GiJoint,

} from "react-icons/gi";
import {
  FaSyringe,
  FaCapsules,
  FaBone,
  FaBaby,
  FaLeaf,
  FaShieldAlt,
} from "react-icons/fa";
import {
  MdOutlineScience,
  MdOutlineMedicalServices,
  MdOutlineVaccines,
  MdOutlineBloodtype,
} from "react-icons/md";
import { TbBrain } from "react-icons/tb";
import { BsGenderFemale } from "react-icons/bs";
import { LuMicroscope, LuFlaskConical } from "react-icons/lu";

// Map: keyword → { icon component, color }
export const PHARMA_ICON_MAP = [
  { keys: ["ivf", "in vitro", "fertility"], Icon: LuFlaskConical, color: "#005EB8" },
  { keys: ["gynaecology", "gynae", "gyno", "women", "gynecology"], Icon: BsGenderFemale, color: "#e05cb8" },
  { keys: ["anti cancer", "anticancer", "oncology", "cancer"], Icon: LuMicroscope, color: "#c0392b" },
  { keys: ["antibiotic", "supplement", "vitamin"], Icon: FaCapsules, color: "#27ae60" },
  { keys: ["transplant"], Icon: MdOutlineVaccines, color: "#8e44ad" },
  { keys: ["sexual", "hgh", "human growth", "hormone", "testosterone"], Icon: FaSyringe, color: "#e67e22" },
  { keys: ["osteoporosis", "bone density"], Icon: FaBone, color: "#7f8c8d" },
  { keys: ["paediatric", "pediatric", "child", "infant", "baby"], Icon: FaBaby, color: "#3498db" },
  { keys: ["antifungal", "fungal"], Icon: MdOutlineScience, color: "#16a085" },
  { keys: ["anemia", "anaemia", "iron", "blood"], Icon: MdOutlineBloodtype, color: "#e74c3c" },
  { keys: ["arthritis", "joint", "rheum"], Icon: GiJoint, color: "#d35400" },
  { keys: ["ayurvedic", "ayurveda", "herbal", "natural"], Icon: FaLeaf, color: "#27ae60" },
  { keys: ["hormonal", "hormone"], Icon: TbBrain, color: "#9b59b6" },
  { keys: ["chronic", "diabetes", "cardiac", "cardio"], Icon: GiHeartOrgan, color: "#e74c3c" },
  { keys: ["offer", "sale", "discount"], Icon: FaShieldAlt, color: "#f39c12" },
];

export function getPharmaIcon(name = "", slug = "") {
  const n = name.toLowerCase();
  const s = slug.toLowerCase();
  for (const entry of PHARMA_ICON_MAP) {
    if (entry.keys.some((k) => n.includes(k) || s.includes(k))) {
      return entry;
    }
  }
  return { Icon: MdOutlineMedicalServices, color: "#005EB8" };
}
