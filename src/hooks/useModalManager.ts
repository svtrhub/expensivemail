import { useState, useCallback } from 'react';
import { Expense, AnomalyRecord } from '../types';

export type ModalType =
  | 'add'
  | 'edit'
  | 'settings'
  | 'currency'
  | 'account'
  | 'language'
  | 'rules'
  | 'report'
  | 'provenance'
  | 'syncLogs'
  | 'subscription'
  | 'bankManager'
  | 'fixAnomaly'
  | 'createAccount'
  | 'emailDetail'
  | null;

export interface ModalPayloadMap {
  add?: { initialCategory?: string };
  edit?: Expense;
  fixAnomaly?: { anomaly: AnomalyRecord; expense: Expense };
  emailDetail?: Expense;
  [key: string]: any;
}

export interface UseModalManagerReturn {
  activeModal: ModalType;
  payload: any;
  openModal: (type: ModalType, payload?: any) => void;
  closeModal: () => void;
  isOpen: (type: ModalType) => boolean;
}

export function useModalManager(): UseModalManagerReturn {
  const [activeModal, setActiveModal] = useState<ModalType>(null);
  const [payload, setPayload] = useState<any>(null);

  const openModal = useCallback((type: ModalType, modalPayload?: any) => {
    setActiveModal(type);
    setPayload(modalPayload || null);
  }, []);

  const closeModal = useCallback(() => {
    setActiveModal(null);
    setPayload(null);
  }, []);

  const isOpen = useCallback(
    (type: ModalType) => activeModal === type,
    [activeModal]
  );

  return {
    activeModal,
    payload,
    openModal,
    closeModal,
    isOpen,
  };
}
