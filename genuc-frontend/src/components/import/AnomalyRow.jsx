// src/components/import/AnomalyRow.jsx
import { useState } from 'react';

export default function AnomalyRow({ ligne, index, onCorriger }) {
  const [matricule, setMatricule] = useState(ligne.matricule);

  return (
    <tr>
      <td>{index + 1}</td>
      <td>
        <input 
          type="text" 
          value={matricule} 
          onChange={e => { setMatricule(e.target.value); onCorriger(index, 'matricule', e.target.value); }}
          style={{ width: 80, padding: '2px 4px' }}
        />
      </td>
      {/* ... */}
    </tr>
  );
}