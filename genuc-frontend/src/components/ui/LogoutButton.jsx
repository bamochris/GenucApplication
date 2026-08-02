import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Button from './Button';
import ConfirmationModal from './ConfirmationModal'; // à créer

const LogoutButton = ({ variant = 'danger', size = 'medium', label = 'Déconnexion' }) => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <>
      <Button 
        variant={variant} 
        size={size} 
        iconLeft="🚪" 
        onClick={() => setShowModal(true)}
      >
        {label}
      </Button>
      {showModal && (
        <ConfirmationModal
          title="Déconnexion"
          message="Êtes-vous sûr de vouloir vous déconnecter ?"
          onConfirm={handleLogout}
          onCancel={() => setShowModal(false)}
        />
      )}
    </>
  );
};

export default LogoutButton;