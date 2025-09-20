import React from 'react';
import Icons from './Icons';

/**
 * Reusable Confirmation Modal Component
 *
 * Replaces browser confirm() dialogs with a consistent modal interface
 * Supports different types (warning, error, info) with appropriate styling
 */
const ConfirmationModal = ({
  isOpen,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  type = 'warning', // warning, error, info, success
  onConfirm,
  onCancel,
  loading = false
}) => {
  if (!isOpen) return null;

  const typeConfig = {
    warning: {
      iconBg: 'bg-yellow-100',
      iconColor: 'text-yellow-600',
      icon: Icons.Warning,
      confirmBg: 'bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-500'
    },
    error: {
      iconBg: 'bg-red-100',
      iconColor: 'text-red-600',
      icon: Icons.Warning,
      confirmBg: 'bg-red-600 hover:bg-red-700 focus:ring-red-500'
    },
    info: {
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-600',
      icon: Icons.Ticket,
      confirmBg: 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500'
    },
    success: {
      iconBg: 'bg-green-100',
      iconColor: 'text-green-600',
      icon: Icons.Success,
      confirmBg: 'bg-green-600 hover:bg-green-700 focus:ring-green-500'
    }
  };

  const config = typeConfig[type] || typeConfig.warning;
  const IconComponent = config.icon;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
          onClick={onCancel}
        ></div>

        {/* Center the modal */}
        <span className="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>

        {/* Modal content */}
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="sm:flex sm:items-start">
              {/* Icon */}
              <div className={`mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full ${config.iconBg} sm:mx-0 sm:h-10 sm:w-10`}>
                <IconComponent size={20} className={config.iconColor} />
              </div>

              {/* Content */}
              <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  {title}
                </h3>
                <div className="mt-2">
                  <p className="text-sm text-gray-500">
                    {message}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            <button
              type="button"
              onClick={onConfirm}
              disabled={loading}
              className={`w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 text-base font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 ${config.confirmBg}`}
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Processing...
                </>
              ) : (
                confirmText
              )}
            </button>
            <button
              type="button"
              onClick={onCancel}
              disabled={loading}
              className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
            >
              {cancelText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Hook for using confirmation modals
 * Provides a simple API similar to window.confirm()
 */
export const useConfirmation = () => {
  const [modalState, setModalState] = React.useState({
    isOpen: false,
    title: '',
    message: '',
    type: 'warning',
    confirmText: 'Confirm',
    cancelText: 'Cancel',
    onConfirm: null,
    loading: false
  });

  const confirm = React.useCallback((options) => {
    return new Promise((resolve) => {
      setModalState({
        isOpen: true,
        title: options.title || 'Confirm Action',
        message: options.message || 'Are you sure you want to continue?',
        type: options.type || 'warning',
        confirmText: options.confirmText || 'Confirm',
        cancelText: options.cancelText || 'Cancel',
        onConfirm: () => {
          setModalState(prev => ({ ...prev, isOpen: false }));
          resolve(true);
        },
        loading: false
      });
    });
  }, []);

  const cancel = React.useCallback(() => {
    setModalState(prev => ({ ...prev, isOpen: false }));
  }, []);

  const setLoading = React.useCallback((loading) => {
    setModalState(prev => ({ ...prev, loading }));
  }, []);

  const ConfirmationModalComponent = React.useCallback(() => (
    <ConfirmationModal
      {...modalState}
      onCancel={cancel}
    />
  ), [modalState, cancel]);

  return {
    confirm,
    setLoading,
    ConfirmationModal: ConfirmationModalComponent
  };
};

/**
 * Information Modal Component
 * For showing information messages (replaces alert())
 */
export const InformationModal = ({
  isOpen,
  title,
  message,
  buttonText = 'OK',
  type = 'info',
  onClose
}) => {
  if (!isOpen) return null;

  const typeConfig = {
    info: {
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-600',
      icon: Icons.Ticket,
      buttonBg: 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500'
    },
    success: {
      iconBg: 'bg-green-100',
      iconColor: 'text-green-600',
      icon: Icons.Success,
      buttonBg: 'bg-green-600 hover:bg-green-700 focus:ring-green-500'
    },
    warning: {
      iconBg: 'bg-yellow-100',
      iconColor: 'text-yellow-600',
      icon: Icons.Warning,
      buttonBg: 'bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-500'
    },
    error: {
      iconBg: 'bg-red-100',
      iconColor: 'text-red-600',
      icon: Icons.Warning,
      buttonBg: 'bg-red-600 hover:bg-red-700 focus:ring-red-500'
    }
  };

  const config = typeConfig[type] || typeConfig.info;
  const IconComponent = config.icon;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
          onClick={onClose}
        ></div>

        <span className="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>

        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="sm:flex sm:items-start">
              <div className={`mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full ${config.iconBg} sm:mx-0 sm:h-10 sm:w-10`}>
                <IconComponent size={20} className={config.iconColor} />
              </div>

              <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  {title}
                </h3>
                <div className="mt-2">
                  <p className="text-sm text-gray-500">
                    {message}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            <button
              type="button"
              onClick={onClose}
              className={`w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 text-base font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 sm:w-auto sm:text-sm ${config.buttonBg}`}
            >
              {buttonText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Hook for information modals
 */
export const useInformation = () => {
  const [modalState, setModalState] = React.useState({
    isOpen: false,
    title: '',
    message: '',
    type: 'info',
    buttonText: 'OK'
  });

  const showInfo = React.useCallback((options) => {
    setModalState({
      isOpen: true,
      title: options.title || 'Information',
      message: options.message || '',
      type: options.type || 'info',
      buttonText: options.buttonText || 'OK'
    });
  }, []);

  const close = React.useCallback(() => {
    setModalState(prev => ({ ...prev, isOpen: false }));
  }, []);

  const InformationModalComponent = React.useCallback(() => (
    <InformationModal
      {...modalState}
      onClose={close}
    />
  ), [modalState, close]);

  return {
    showInfo,
    InformationModal: InformationModalComponent
  };
};

export default ConfirmationModal;