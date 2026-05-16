const fs = require('fs');
let code = fs.readFileSync('src/components/OwnerSettingsTab.tsx', 'utf8');

code = code.replace(/defaultValue=\{gymInfo\.(.*?)\s*\|\|\s*''\}/g, `value={localGym.$1 || ''}
                onChange={(e) => setLocalGym({...localGym, $1: e.target.value})}`);

code = code.replace(/defaultValue=\{gymInfo\.name\}/g, `value={localGym.name || ''}
                onChange={(e) => setLocalGym({...localGym, name: e.target.value})}`);

code = code.replace(/defaultValue=\{gymInfo\.capacity\s*\|\|\s*100\}/g, `value={localGym.capacity || 100}
                  onChange={(e) => setLocalGym({...localGym, capacity: Number(e.target.value)})}`);

code = code.replace(/defaultValue=\{gymInfo\.brandingColor\s*\|\|\s*'#FF8F6F'\}/g, `value={localGym.brandingColor || '#FF8F6F'}
                  onChange={(e) => setLocalGym({...localGym, brandingColor: e.target.value})}`);

code = code.replace(/export default function OwnerSettingsTab\(\{ gymInfo \}: \{ gymInfo: any \}\) \{/g, `export default function OwnerSettingsTab({ gymInfo }: { gymInfo: any }) {
  const [localGym, setLocalGym] = React.useState(gymInfo || {});
  React.useEffect(() => {
    if (gymInfo) setLocalGym(gymInfo);
  }, [gymInfo]);
`);

fs.writeFileSync('src/components/OwnerSettingsTab.tsx', code, 'utf8');
