export function QrVisual({code,size=150}:{code:string;size?:number}){
 const n=17; const hash=[...code].reduce((a,c)=>a+c.charCodeAt(0),0); const cells=[] as boolean[];
 const inFinder=(x:number,y:number,ox:number,oy:number)=>x>=ox&&x<ox+5&&y>=oy&&y<oy+5&&((x===ox||x===ox+4||y===oy||y===oy+4)||(x>=ox+2&&x<=ox+2&&y>=oy+2&&y<=oy+2));
 for(let y=0;y<n;y++)for(let x=0;x<n;x++){const finder=inFinder(x,y,0,0)||inFinder(x,y,n-5,0)||inFinder(x,y,0,n-5); const bit=((x*13+y*7+hash+(x*y))%5)<2;cells.push(finder||bit)}
 return <div className="qr" style={{width:size,height:size,gridTemplateColumns:`repeat(${n},1fr)`}} aria-label={`QR visual ${code}`}>{cells.map((on,i)=><span key={i} className={on?'on':''}/>)}</div>
}
