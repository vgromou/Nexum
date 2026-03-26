import React, { useState } from 'react';
import Modal from '../components/Modal';
import Button from '../components/Button';

export default {
  title: 'Components/Modal',
  component: Modal,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `A modal dialog component with header, body, and footer sections.

**Features:**
- Three sizes: sm (400px), md (480px), lg (560px)
- Two overlay variants: dim, blur
- Close button in header
- Close on overlay click and Escape key
- Animated entrance/exit

**Accessibility:**
- Uses dialog role with aria-modal
- Focus management
- Escape key support`,
      },
    },
  },
  argTypes: {
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
      description: 'Modal size',
    },
    overlayVariant: {
      control: 'select',
      options: ['dim', 'blur'],
      description: 'Overlay variant',
    },
    showCloseButton: {
      control: 'boolean',
      description: 'Show close button in header',
    },
    closeOnOverlayClick: {
      control: 'boolean',
      description: 'Close modal when clicking overlay',
    },
    closeOnEscape: {
      control: 'boolean',
      description: 'Close modal when pressing Escape',
    },
  },
};

// Background content for demos
const BackgroundContent = () => (
  <div style={{ padding: '40px', fontFamily: 'Inter, sans-serif' }}>
    <h1 style={{ marginBottom: '16px', color: '#1F2937' }}>Page Title</h1>
    <p style={{ marginBottom: '12px', color: '#6B7280' }}>
      This is the page content behind the modal. Click the button below to open the modal.
    </p>
  </div>
);

// Interactive demo component
const ModalDemo = ({ size, overlayVariant, ...props }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div style={{ minHeight: '400px' }}>
      <BackgroundContent />
      <div style={{ padding: '0 40px' }}>
        <Button variant="primary" onClick={() => setIsOpen(true)}>
          Open Modal
        </Button>
      </div>
      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Modal Title"
        size={size}
        overlayVariant={overlayVariant}
        footer={
          <div style={{ display: 'flex', gap: '8px' }}>
            <Button variant="ghost" size="sm" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={() => setIsOpen(false)}>
              Confirm
            </Button>
          </div>
        }
        {...props}
      >
        <p style={{ color: '#6B7280', fontSize: '14px', lineHeight: '22px' }}>
          This is the modal content. You can put any content here including forms, text, or other
          components.
        </p>
      </Modal>
    </div>
  );
};

// Playground
export const Playground = {
  args: {
    size: 'md',
    overlayVariant: 'dim',
    showCloseButton: true,
    closeOnOverlayClick: true,
    closeOnEscape: true,
  },
  render: (args) => <ModalDemo {...args} />,
};

// Size variations
export const Sizes = {
  render: () => {
    const [openModal, setOpenModal] = useState(null);

    return (
      <div style={{ minHeight: '400px' }}>
        <BackgroundContent />
        <div style={{ display: 'flex', gap: '8px', padding: '0 40px' }}>
          <Button variant="primary" onClick={() => setOpenModal('sm')}>
            Small (400px)
          </Button>
          <Button variant="primary" onClick={() => setOpenModal('md')}>
            Medium (480px)
          </Button>
          <Button variant="primary" onClick={() => setOpenModal('lg')}>
            Large (560px)
          </Button>
        </div>

        <Modal
          isOpen={openModal === 'sm'}
          onClose={() => setOpenModal(null)}
          title="Small Modal"
          size="sm"
          footer={
            <Button variant="primary" size="sm" onClick={() => setOpenModal(null)}>
              Close
            </Button>
          }
        >
          <p style={{ color: '#6B7280', fontSize: '14px' }}>
            This is a small modal (400px width).
          </p>
        </Modal>

        <Modal
          isOpen={openModal === 'md'}
          onClose={() => setOpenModal(null)}
          title="Medium Modal"
          size="md"
          footer={
            <Button variant="primary" size="sm" onClick={() => setOpenModal(null)}>
              Close
            </Button>
          }
        >
          <p style={{ color: '#6B7280', fontSize: '14px' }}>
            This is a medium modal (480px width). This is the default size.
          </p>
        </Modal>

        <Modal
          isOpen={openModal === 'lg'}
          onClose={() => setOpenModal(null)}
          title="Large Modal"
          size="lg"
          footer={
            <Button variant="primary" size="sm" onClick={() => setOpenModal(null)}>
              Close
            </Button>
          }
        >
          <p style={{ color: '#6B7280', fontSize: '14px' }}>
            This is a large modal (560px width). Use this for more complex content.
          </p>
        </Modal>
      </div>
    );
  },
};

// Overlay variants
export const OverlayVariants = {
  render: () => {
    const [openModal, setOpenModal] = useState(null);

    return (
      <div style={{ minHeight: '400px' }}>
        <BackgroundContent />
        <div style={{ display: 'flex', gap: '8px', padding: '0 40px' }}>
          <Button variant="primary" onClick={() => setOpenModal('dim')}>
            Dim Overlay
          </Button>
          <Button variant="primary" onClick={() => setOpenModal('blur')}>
            Blur Overlay
          </Button>
        </div>

        <Modal
          isOpen={openModal === 'dim'}
          onClose={() => setOpenModal(null)}
          title="Dim Overlay"
          overlayVariant="dim"
          footer={
            <Button variant="primary" size="sm" onClick={() => setOpenModal(null)}>
              Close
            </Button>
          }
        >
          <p style={{ color: '#6B7280', fontSize: '14px' }}>
            This modal uses the dim overlay (semi-transparent black).
          </p>
        </Modal>

        <Modal
          isOpen={openModal === 'blur'}
          onClose={() => setOpenModal(null)}
          title="Blur Overlay"
          overlayVariant="blur"
          footer={
            <Button variant="primary" size="sm" onClick={() => setOpenModal(null)}>
              Close
            </Button>
          }
        >
          <p style={{ color: '#6B7280', fontSize: '14px' }}>
            This modal uses the blur overlay (white with backdrop blur).
          </p>
        </Modal>
      </div>
    );
  },
};

// With form content
export const WithForm = {
  render: () => {
    const [isOpen, setIsOpen] = useState(false);

    return (
      <div style={{ minHeight: '400px' }}>
        <BackgroundContent />
        <div style={{ padding: '0 40px' }}>
          <Button variant="primary" onClick={() => setIsOpen(true)}>
            Open Form Modal
          </Button>
        </div>

        <Modal
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          title="Create New Item"
          size="md"
          footer={
            <div style={{ display: 'flex', gap: '8px' }}>
              <Button variant="ghost" size="sm" onClick={() => setIsOpen(false)}>
                Cancel
              </Button>
              <Button variant="primary" size="sm" onClick={() => setIsOpen(false)}>
                Create
              </Button>
            </div>
          }
        >
          <form style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label
                style={{
                  display: 'block',
                  marginBottom: '4px',
                  fontSize: '13px',
                  fontWeight: 500,
                  color: '#1F2937',
                }}
              >
                Name
              </label>
              <input
                type="text"
                placeholder="Enter name"
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #E5E7EB',
                  borderRadius: '6px',
                  fontSize: '14px',
                  boxSizing: 'border-box',
                }}
              />
            </div>
            <div>
              <label
                style={{
                  display: 'block',
                  marginBottom: '4px',
                  fontSize: '13px',
                  fontWeight: 500,
                  color: '#1F2937',
                }}
              >
                Description
              </label>
              <textarea
                placeholder="Enter description"
                rows={3}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #E5E7EB',
                  borderRadius: '6px',
                  fontSize: '14px',
                  resize: 'vertical',
                  boxSizing: 'border-box',
                }}
              />
            </div>
          </form>
        </Modal>
      </div>
    );
  },
};

// Without close button
export const WithoutCloseButton = {
  render: () => {
    const [isOpen, setIsOpen] = useState(false);

    return (
      <div style={{ minHeight: '400px' }}>
        <BackgroundContent />
        <div style={{ padding: '0 40px' }}>
          <Button variant="primary" onClick={() => setIsOpen(true)}>
            Open Modal
          </Button>
        </div>

        <Modal
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          title="Confirmation"
          showCloseButton={false}
          closeOnOverlayClick={false}
          footer={
            <div style={{ display: 'flex', gap: '8px' }}>
              <Button variant="ghost" size="sm" onClick={() => setIsOpen(false)}>
                No
              </Button>
              <Button variant="primary" size="sm" onClick={() => setIsOpen(false)}>
                Yes
              </Button>
            </div>
          }
        >
          <p style={{ color: '#6B7280', fontSize: '14px' }}>
            Are you sure you want to proceed? This action cannot be undone.
          </p>
        </Modal>
      </div>
    );
  },
};

// Multiple footer buttons
export const MultipleFooterButtons = {
  render: () => {
    const [isOpen, setIsOpen] = useState(false);

    return (
      <div style={{ minHeight: '400px' }}>
        <BackgroundContent />
        <div style={{ padding: '0 40px' }}>
          <Button variant="primary" onClick={() => setIsOpen(true)}>
            Open Modal
          </Button>
        </div>

        <Modal
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          title="Modal Title"
          footer={
            <>
              <Button variant="outline" size="sm" onClick={() => setIsOpen(false)}>
                Cancel
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setIsOpen(false)}>
                Save Draft
              </Button>
              <Button variant="primary" size="sm" onClick={() => setIsOpen(false)}>
                Submit
              </Button>
            </>
          }
        >
          <p style={{ color: '#9CA3AF', fontSize: '14px' }}>
            Placeholder content
          </p>
        </Modal>
      </div>
    );
  },
};
