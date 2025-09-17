export default function CommunitiesCard(){
  const communities = [
    { name: 'MedTech for Humanity', desc: 'A forward-thinking space for developers, medtech...', img: '/logo/sally.jpg' },
    { name: 'Telehealth & Innovation', desc: 'Discuss telemedicine, AI, and digital health.', img: '/logo/sally.jpg' },
    { name: 'Global Health Awareness', desc: 'Global health issues from nutrition to policy.', img: '/logo/sally.jpg' },
    { name: 'News & Policy Hub', desc: 'A space for healthcare policy and news.', img: '/logo/sally.jpg' },
  ]
  return (
    <div className="card">
      <h4>Join Communities</h4>
      <div>
        {communities.map((c, i) => (
          <div key={i} style={{display:'flex', alignItems:'center', gap:10, padding:'8px 0', borderBottom:'1px solid #eee'}}>
            <img src={c.img} alt="" style={{width:34, height:34, borderRadius:8}} />
            <div style={{flex:1}}>
              <div style={{fontWeight:600}}>{c.name}</div>
              <div style={{fontSize:12, opacity:0.7}}>{c.desc}</div>
            </div>
            <button className="primary">Join</button>
          </div>
        ))}
      </div>
    </div>
  )
}

