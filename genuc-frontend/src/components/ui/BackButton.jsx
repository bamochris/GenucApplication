import React from 'react';
import { useNavigate } from 'react-router-dom';
import Button from './Button';

const BackButton = ({ defaultPath = '/', label = 'Retour', icon = '←' }) => {
  const navigate = useNavigate();
  return (
    <Button variant="outline" size="medium" iconLeft={icon} onClick={() => navigate(-1)}>
      {label}
    </Button>
  );
};

export default BackButton;