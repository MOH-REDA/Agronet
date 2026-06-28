import React, { memo } from 'react';
import { Calendar, Fuel, Gauge, Navigation, Ruler, Settings2, Wrench } from 'lucide-react';
import { useLanguage } from '../../i18n/LanguageContext';
import { getMarketplaceCopy } from './marketplaceCopy';

const EquipmentSpecs = memo(({ item }) => {
  const { language } = useLanguage(); const c = getMarketplaceCopy(language);
  const specs=[item.hp&&{icon:Gauge,label:`${item.hp} HP`},item.year&&{icon:Calendar,label:item.year},item.fuel_type&&{icon:Fuel,label:item.fuel_type},item.transmission&&{icon:Settings2,label:item.transmission},item.working_width&&{icon:Ruler,label:`${item.working_width} m`},item.gps_ready&&{icon:Navigation,label:c.gps},item.machine_condition&&{icon:Wrench,label:item.machine_condition}].filter(Boolean).slice(0,5);
  if(!specs.length)return <div className="equipment-specs"/>;
  return <div className="equipment-specs" aria-label={c.specs}>{specs.map(({icon,label})=><span key={label}>{React.createElement(icon,{size:14,'aria-hidden':true})}{label}</span>)}</div>;
});

EquipmentSpecs.displayName='EquipmentSpecs';
export default EquipmentSpecs;
