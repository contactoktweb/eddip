import {Icon} from '@/lib/icons';
export function StatCard({label,value,icon,delta}:{label:string;value:string|number;icon:string;delta?:string}){return <div className="stat-card"><div className="stat-icon"><Icon name={icon}/></div><div><span>{label}</span><strong>{value}</strong>{delta&&<small>{delta}</small>}</div></div>}
