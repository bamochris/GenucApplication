// src/components/ReçuPDF.jsx
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: { padding: 30, fontSize: 10, fontFamily: 'Helvetica' },
  header: { marginBottom: 20, textAlign: 'center', borderBottom: '1px solid #0B1F4A', paddingBottom: 10 },
  title: { fontSize: 16, fontWeight: 'bold', color: '#212529' },
  subtitle: { fontSize: 11, color: '#444444' },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4, borderBottom: '1px solid #e0e0e0' },
  label: { fontWeight: 'bold', width: '40%' },
  value: { width: '60%', textAlign: 'right' },
  total: { fontSize: 14, fontWeight: 'bold', color: '#1D9E75', marginTop: 10, textAlign: 'right' },
  footer: { marginTop: 20, textAlign: 'center', fontSize: 8, color: '#666666', borderTop: '1px solid #ddd', paddingTop: 10 },
});

const ReçuPDF = ({ recu }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <View style={styles.header}>
        <Text style={styles.title}>GENUC — Reçu de paiement</Text>
        <Text style={styles.subtitle}>{recu.universite}</Text>
      </View>

      <View>
        <View style={styles.row}><Text style={styles.label}>Référence</Text><Text style={styles.value}>{recu.reference}</Text></View>
        <View style={styles.row}><Text style={styles.label}>Date</Text><Text style={styles.value}>{recu.date}</Text></View>
        <View style={styles.row}><Text style={styles.label}>Étudiant</Text><Text style={styles.value}>{recu.etudiant}</Text></View>
        <View style={styles.row}><Text style={styles.label}>Matricule</Text><Text style={styles.value}>{recu.matricule}</Text></View>
        <View style={styles.row}><Text style={styles.label}>Département</Text><Text style={styles.value}>{recu.departement}</Text></View>
        <View style={styles.row}><Text style={styles.label}>Niveau</Text><Text style={styles.value}>{recu.niveau}</Text></View>
        <View style={styles.row}><Text style={styles.label}>Année académique</Text><Text style={styles.value}>{recu.anneeAcademique}</Text></View>
        <View style={styles.row}><Text style={styles.label}>Type de paiement</Text><Text style={styles.value}>{recu.typePaiement}</Text></View>
        <View style={styles.row}><Text style={styles.label}>Mode de paiement</Text><Text style={styles.value}>{recu.modePaiement}</Text></View>
        {recu.numeroTransaction && (
          <View style={styles.row}><Text style={styles.label}>N° transaction</Text><Text style={styles.value}>{recu.numeroTransaction}</Text></View>
        )}
        {recu.operateur && (
          <View style={styles.row}><Text style={styles.label}>Opérateur</Text><Text style={styles.value}>{recu.operateur}</Text></View>
        )}
        <Text style={styles.total}>Montant : {recu.montant} {recu.devise}</Text>
        <Text style={{ textAlign: 'center', marginTop: 5, fontSize: 9, color: '#666666' }}>Statut : {recu.statut}</Text>
      </View>

      <View style={styles.footer}>
        <Text>Reçu généré par GENUC — Académie Intégrale</Text>
        <Text>{recu.genereA}</Text>
      </View>
    </Page>
  </Document>
);

export default ReçuPDF;