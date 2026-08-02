// src/components/CertificatPalmaresPDF.jsx
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: {
    padding: 40,
    backgroundColor: '#ffffff',
    fontFamily: 'Helvetica',
  },
  border: {
    border: '2px solid #0B1F4A',
    padding: 30,
    height: '100%',
    position: 'relative',
  },
  header: {
    textAlign: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#212529',
    letterSpacing: 2,
  },
  subtitle: {
    fontSize: 14,
    color: '#185FA5',
    letterSpacing: 1,
    marginTop: 4,
  },
  line: {
    borderBottom: '2px solid #185FA5',
    width: '40%',
    marginHorizontal: 'auto',
    marginVertical: 15,
  },
  content: {
    textAlign: 'center',
    marginTop: 20,
  },
  medal: {
    fontSize: 48,
    marginBottom: 8,
  },
  name: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#212529',
    marginVertical: 10,
    textTransform: 'uppercase',
  },
  info: {
    fontSize: 12,
    color: '#444444',
    marginBottom: 4,
    lineHeight: 1.6,
  },
  highlight: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#185FA5',
  },
  mention: {
    fontSize: 16,
    fontWeight: 'bold',
    padding: '4px 16px',
    borderRadius: 4,
    display: 'inline-block',
    marginVertical: 8,
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    textAlign: 'center',
    fontSize: 9,
    color: '#6b7280',
    borderTop: '1px solid #e0e0e0',
    paddingTop: 10,
  },
  qrContainer: {
    marginTop: 15,
    alignItems: 'center',
  },
  qrText: {
    fontSize: 8,
    color: '#6b7280',
    marginTop: 4,
  },
});

const CertificatPalmaresPDF = ({
  nomComplet,
  filiere,
  universite,
  moyenne,
  mention,
  annee,
  rang,
  photoUrl,
}) => {
  const getMentionColor = (m) => {
    const colors = {
      'TRES_GRANDE_DISTINCTION': '#1D9E75',
      'GRANDE_DISTINCTION': '#185FA5',
      'DISTINCTION': '#854F0B',
      'SATISFACTION': '#0F6E56',
      'REUSSITE': '#0B1F4A',
    };
    return colors[m] || '#0B1F4A';
  };

  const getMentionLabel = (m) => {
    const labels = {
      'TRES_GRANDE_DISTINCTION': 'Très Grande Distinction',
      'GRANDE_DISTINCTION': 'Grande Distinction',
      'DISTINCTION': 'Distinction',
      'SATISFACTION': 'Satisfaction',
      'REUSSITE': 'Réussite',
    };
    return labels[m] || m;
  };

  const getMedalEmoji = (r) => {
    if (r === 1) return '🥇';
    if (r === 2) return '🥈';
    if (r === 3) return '🥉';
    return '🏅';
  };

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.border}>
          <View style={styles.header}>
            <Text style={styles.title}>GENUC</Text>
            <Text style={styles.subtitle}>Académie Intégrale du Congo</Text>
            <View style={styles.line} />
          </View>

          <View style={styles.content}>
            <Text style={styles.medal}>{getMedalEmoji(rang)}</Text>
            <Text style={{ fontSize: 14, color: '#6b7280', marginBottom: 4 }}>
              Certificat de Mérite Académique
            </Text>
            <Text style={{ fontSize: 10, color: '#6b7280', marginBottom: 8 }}>
              Décerné à
            </Text>

            <Text style={styles.name}>{nomComplet}</Text>

            <Text style={styles.info}>
              Pour son excellence académique dans la filière{' '}
              <Text style={styles.highlight}>{filiere}</Text>
            </Text>
            <Text style={styles.info}>
              À l'université <Text style={styles.highlight}>{universite}</Text>
            </Text>

            <View style={{ marginVertical: 12 }}>
              <Text style={styles.info}>
                Moyenne générale : <Text style={{ fontWeight: 'bold' }}>{moyenne}/20</Text>
              </Text>
              <Text style={styles.info}>
                Rang : <Text style={{ fontWeight: 'bold' }}>#{rang}</Text>
              </Text>
            </View>

            <View style={{
              backgroundColor: `${getMentionColor(mention)}15`,
              padding: '8px 16px',
              borderRadius: 8,
              alignSelf: 'center',
              marginVertical: 8,
            }}>
              <Text style={{
                fontSize: 16,
                fontWeight: 'bold',
                color: getMentionColor(mention),
              }}>
                {getMentionLabel(mention)}
              </Text>
            </View>

            <Text style={{ fontSize: 11, color: '#6b7280', marginTop: 12 }}>
              Année académique {annee}
            </Text>

            <View style={styles.qrContainer}>
              <Text style={styles.qrText}>
                Vérifiable sur https://genuc.cd/palmares
              </Text>
            </View>
          </View>

          <View style={styles.footer}>
            <Text>GENUC — Plateforme nationale de gestion universitaire</Text>
            <Text>Ce certificat atteste de l'excellence académique du lauréat</Text>
          </View>
        </View>
      </Page>
    </Document>
  );
};

export default CertificatPalmaresPDF;