import React from 'react';
import { Bell, Plus, Check, X, Search, ChevronDown } from 'lucide-react';

export default {
  title: 'Design System/Buttons',
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: 'Comprehensive button system redesigned to match Figma specifications exactly.\n\n**Regular Buttons:** 3 sizes × 5 content types × 4 states × 9 color variants = 540 total combinations.\n\n**Icon Buttons:** Compact square buttons with 4 sizes × 4 states = 16 variants.',
      },
    },
  },
};

// Helper component to create consistent headers
const SectionHeader = ({ children }) => (
  <h3 style={{
    marginBottom: '16px',
    marginTop: '32px',
    fontFamily: 'var(--font-family-sans)',
    color: 'var(--text-secondary)',
    fontSize: '14px',
    fontWeight: 500,
    textTransform: 'uppercase',
    letterSpacing: '0.05em'
  }}>
    {children}
  </h3>
);

const Divider = () => (
  <div style={{ height: '1px', background: 'var(--border-light)', margin: '32px 0' }} />
);

// ===== 1. INTERACTIVE (with controls) =====
export const Interactive = {
  render: (args) => {
    const IconComponent = args.showIcon ? Bell : null;

    return (
      <button
        className={`btn ${args.variant} ${args.size} ${args.iconPosition}`}
        disabled={args.disabled}
        aria-label={args.iconPosition === 'btn-icon' && IconComponent ? 'Icon button' : undefined}
      >
        {args.iconPosition === 'btn-icon-left' && IconComponent && <IconComponent />}
        {args.iconPosition === 'btn-icon-both' && IconComponent && <IconComponent />}
        {args.iconPosition !== 'btn-icon' && args.text}
        {args.iconPosition === 'btn-icon' && IconComponent && <IconComponent />}
        {args.iconPosition === 'btn-icon-right' && IconComponent && <IconComponent />}
        {args.iconPosition === 'btn-icon-both' && IconComponent && <IconComponent />}
      </button>
    );
  },
  args: {
    text: 'Button Text',
    variant: 'btn-primary',
    size: '',
    iconPosition: '',
    showIcon: false,
    disabled: false,
  },
  argTypes: {
    text: { control: 'text' },
    variant: {
      control: 'select',
      options: ['btn-primary', 'btn-ghost', 'btn-outline', 'btn-destructive', 'btn-destructive-ghost', 'btn-destructive-outline', 'btn-success', 'btn-success-ghost', 'btn-success-outline'],
    },
    size: {
      control: 'select',
      options: ['', 'btn-sm', 'btn-md', 'btn-lg'],
    },
    iconPosition: {
      control: 'select',
      options: ['', 'btn-icon', 'btn-icon-left', 'btn-icon-right', 'btn-icon-both'],
    },
    showIcon: { control: 'boolean' },
    disabled: { control: 'boolean' },
  },
  parameters: {
    docs: {
      description: {
        story: 'Interactive button with all available controls. Use the controls panel to experiment with different combinations.',
      },
    },
  },
};

// ===== 2. ALL SIZES =====
export const AllSizes = {
  render: () => (
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
      <button className="btn btn-primary btn-sm">Small (26px)</button>
      <button className="btn btn-primary">Medium (36px)</button>
      <button className="btn btn-primary btn-lg">Large (40px)</button>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Three button sizes: Small (26px height), Medium (36px height, default), Large (40px height).',
      },
    },
  },
};

// ===== 3. TEXT ONLY =====
export const TextOnly = {
  render: () => (
    <div>
      <SectionHeader>Small (26px)</SectionHeader>
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '24px' }}>
        <button className="btn btn-primary btn-sm">Default</button>
        <button className="btn btn-primary btn-sm" data-state="hover">Hover</button>
        <button className="btn btn-primary btn-sm" data-state="active">Active</button>
        <button className="btn btn-primary btn-sm" disabled>Disabled</button>
      </div>

      <SectionHeader>Medium (36px)</SectionHeader>
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '24px' }}>
        <button className="btn btn-primary">Default</button>
        <button className="btn btn-primary" data-state="hover">Hover</button>
        <button className="btn btn-primary" data-state="active">Active</button>
        <button className="btn btn-primary" disabled>Disabled</button>
      </div>

      <SectionHeader>Large (40px)</SectionHeader>
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
        <button className="btn btn-primary btn-lg">Default</button>
        <button className="btn btn-primary btn-lg" data-state="hover">Hover</button>
        <button className="btn btn-primary btn-lg" data-state="active">Active</button>
        <button className="btn btn-primary btn-lg" disabled>Disabled</button>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Buttons with text only, showing all sizes (Small 26px, Medium 36px, Large 40px) and all 4 states (default, hover, active, disabled).',
      },
    },
  },
};

// ===== 4. ICON ONLY =====
export const IconOnly = {
  render: () => (
    <div>
      <SectionHeader>Icon Only - All Sizes</SectionHeader>
      <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '16px' }}>
        <button className="btn btn-primary btn-icon btn-sm" aria-label="Notifications">
          <Bell />
        </button>
        <button className="btn btn-primary btn-icon" aria-label="Notifications">
          <Bell />
        </button>
        <button className="btn btn-primary btn-icon btn-lg" aria-label="Notifications">
          <Bell />
        </button>
      </div>

      <SectionHeader>Icon Only - Disabled</SectionHeader>
      <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
        <button className="btn btn-primary btn-icon btn-sm" disabled aria-label="Notifications">
          <Bell />
        </button>
        <button className="btn btn-primary btn-icon" disabled aria-label="Notifications">
          <Bell />
        </button>
        <button className="btn btn-primary btn-icon btn-lg" disabled aria-label="Notifications">
          <Bell />
        </button>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Icon-only buttons (square, aspect-ratio 1:1). Small: 26×26px with 16px icons, Medium: 36×36px with 18px icons, Large: 40×40px with 20px icons.',
      },
    },
  },
};

// ===== 5. WITH LEFT ICON =====
export const WithLeftIcon = {
  render: () => (
    <div>
      <SectionHeader>Left Icon - All Sizes</SectionHeader>
      <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '16px' }}>
        <button className="btn btn-primary btn-icon-left btn-sm">
          <Plus />
          Add Small
        </button>
        <button className="btn btn-primary btn-icon-left">
          <Plus />
          Add Medium
        </button>
        <button className="btn btn-primary btn-icon-left btn-lg">
          <Plus />
          Add Large
        </button>
      </div>

      <SectionHeader>Left Icon - Disabled</SectionHeader>
      <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
        <button className="btn btn-primary btn-icon-left btn-sm" disabled>
          <Plus />
          Add Small
        </button>
        <button className="btn btn-primary btn-icon-left" disabled>
          <Plus />
          Add Medium
        </button>
        <button className="btn btn-primary btn-icon-left btn-lg" disabled>
          <Plus />
          Add Large
        </button>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Buttons with icon on the left side. Icon spacing controlled by button gap (4px for small, 8px for medium/large).',
      },
    },
  },
};

// ===== 6. WITH RIGHT ICON =====
export const WithRightIcon = {
  render: () => (
    <div>
      <SectionHeader>Right Icon - All Sizes</SectionHeader>
      <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '16px' }}>
        <button className="btn btn-primary btn-icon-right btn-sm">
          Search Small
          <Search />
        </button>
        <button className="btn btn-primary btn-icon-right">
          Search Medium
          <Search />
        </button>
        <button className="btn btn-primary btn-icon-right btn-lg">
          Search Large
          <Search />
        </button>
      </div>

      <SectionHeader>Right Icon - Disabled</SectionHeader>
      <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
        <button className="btn btn-primary btn-icon-right btn-sm" disabled>
          Search Small
          <Search />
        </button>
        <button className="btn btn-primary btn-icon-right" disabled>
          Search Medium
          <Search />
        </button>
        <button className="btn btn-primary btn-icon-right btn-lg" disabled>
          Search Large
          <Search />
        </button>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Buttons with icon on the right side. Useful for dropdown indicators, navigation arrows, etc.',
      },
    },
  },
};

// ===== 7. WITH BOTH ICONS =====
export const WithBothIcons = {
  render: () => (
    <div>
      <SectionHeader>Both Icons - All Sizes</SectionHeader>
      <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '16px' }}>
        <button className="btn btn-primary btn-icon-both btn-sm">
          <Check />
          Confirm Small
          <ChevronDown />
        </button>
        <button className="btn btn-primary btn-icon-both">
          <Check />
          Confirm Medium
          <ChevronDown />
        </button>
        <button className="btn btn-primary btn-icon-both btn-lg">
          <Check />
          Confirm Large
          <ChevronDown />
        </button>
      </div>

      <SectionHeader>Both Icons - Disabled</SectionHeader>
      <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
        <button className="btn btn-primary btn-icon-both btn-sm" disabled>
          <Check />
          Confirm Small
          <ChevronDown />
        </button>
        <button className="btn btn-primary btn-icon-both" disabled>
          <Check />
          Confirm Medium
          <ChevronDown />
        </button>
        <button className="btn btn-primary btn-icon-both btn-lg" disabled>
          <Check />
          Confirm Large
          <ChevronDown />
        </button>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Buttons with icons on both sides. Gap spacing applies between left icon + text and text + right icon.',
      },
    },
  },
};

// ===== 8. ALL STATES =====
export const AllStates = {
  render: () => (
    <div>
      <SectionHeader>Primary Button States</SectionHeader>
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '16px' }}>
        <button className="btn btn-primary">Default</button>
        <button className="btn btn-primary" data-state="hover">
          Hover (simulated)
        </button>
        <button className="btn btn-primary" data-state="active">
          Active (simulated)
        </button>
        <button className="btn btn-primary" disabled>Disabled</button>
      </div>

      <p style={{
        fontFamily: 'var(--font-family-sans)',
        fontSize: '13px',
        color: 'var(--text-tertiary)',
        marginTop: '8px'
      }}>
        Hover and active states are interactive - hover over the "Default" button to see the hover state. Simulated states use data-state attributes instead of inline styles.
      </p>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'All four button states: Default, Hover, Active, and Disabled. Hover and active states are automatically applied via CSS pseudo-classes.',
      },
    },
  },
};

// ===== 9. PRIMARY VARIANT =====
export const PrimaryVariant = {
  render: () => (
    <div>
      <h2 style={{
        fontFamily: 'var(--font-family-sans)',
        fontSize: '20px',
        fontWeight: 600,
        marginBottom: '24px',
        color: 'var(--text-primary)'
      }}>
        Primary Buttons - All Combinations
      </h2>

      <SectionHeader>Small (26px)</SectionHeader>
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '24px' }}>
        <button className="btn btn-primary btn-sm">Text</button>
        <button className="btn btn-primary btn-sm btn-icon" aria-label="Notifications"><Bell /></button>
        <button className="btn btn-primary btn-sm btn-icon-left"><Plus />Icon Left</button>
        <button className="btn btn-primary btn-sm btn-icon-right">Icon Right<ChevronDown /></button>
        <button className="btn btn-primary btn-sm btn-icon-both"><Check />Both Icons<X /></button>
      </div>

      <SectionHeader>Medium (36px - Default)</SectionHeader>
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '24px' }}>
        <button className="btn btn-primary">Text</button>
        <button className="btn btn-primary btn-icon" aria-label="Notifications"><Bell /></button>
        <button className="btn btn-primary btn-icon-left"><Plus />Icon Left</button>
        <button className="btn btn-primary btn-icon-right">Icon Right<ChevronDown /></button>
        <button className="btn btn-primary btn-icon-both"><Check />Both Icons<X /></button>
      </div>

      <SectionHeader>Large (40px)</SectionHeader>
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '24px' }}>
        <button className="btn btn-primary btn-lg">Text</button>
        <button className="btn btn-primary btn-lg btn-icon" aria-label="Notifications"><Bell /></button>
        <button className="btn btn-primary btn-lg btn-icon-left"><Plus />Icon Left</button>
        <button className="btn btn-primary btn-lg btn-icon-right">Icon Right<ChevronDown /></button>
        <button className="btn btn-primary btn-lg btn-icon-both"><Check />Both Icons<X /></button>
      </div>

      <SectionHeader>Disabled States</SectionHeader>
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        <button className="btn btn-primary btn-sm" disabled>Small</button>
        <button className="btn btn-primary" disabled>Medium</button>
        <button className="btn btn-primary btn-lg" disabled>Large</button>
        <button className="btn btn-primary btn-icon btn-sm" disabled aria-label="Notifications"><Bell /></button>
        <button className="btn btn-primary btn-icon" disabled aria-label="Notifications"><Bell /></button>
        <button className="btn btn-primary btn-icon btn-lg" disabled aria-label="Notifications"><Bell /></button>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Primary button variant showing all size and content type combinations (15 variants × 4 states = 60 primary button variations).',
      },
    },
  },
};

// ===== 10. GHOST VARIANT =====
export const GhostVariant = {
  render: () => (
    <div>
      <h2 style={{
        fontFamily: 'var(--font-family-sans)',
        fontSize: '20px',
        fontWeight: 600,
        marginBottom: '24px',
        color: 'var(--text-primary)'
      }}>
        Ghost Buttons - All Combinations
      </h2>

      <SectionHeader>All Sizes</SectionHeader>
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '24px' }}>
        <button className="btn btn-ghost btn-sm">Small</button>
        <button className="btn btn-ghost">Medium</button>
        <button className="btn btn-ghost btn-lg">Large</button>
        <button className="btn btn-ghost btn-icon btn-sm" aria-label="Notifications"><Bell /></button>
        <button className="btn btn-ghost btn-icon" aria-label="Notifications"><Bell /></button>
        <button className="btn btn-ghost btn-icon btn-lg" aria-label="Notifications"><Bell /></button>
      </div>

      <SectionHeader>With Icons - Different Sizes</SectionHeader>
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '24px' }}>
        <button className="btn btn-ghost btn-icon-left btn-sm"><Plus />Small</button>
        <button className="btn btn-ghost btn-icon-left"><Plus />Medium</button>
        <button className="btn btn-ghost btn-icon-left btn-lg"><Plus />Large</button>
        <button className="btn btn-ghost btn-icon-right btn-sm">Small<ChevronDown /></button>
        <button className="btn btn-ghost btn-icon-right">Medium<ChevronDown /></button>
        <button className="btn btn-ghost btn-icon-right btn-lg">Large<ChevronDown /></button>
      </div>

      <SectionHeader>Disabled States</SectionHeader>
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        <button className="btn btn-ghost btn-sm" disabled>Small</button>
        <button className="btn btn-ghost" disabled>Medium</button>
        <button className="btn btn-ghost btn-lg" disabled>Large</button>
        <button className="btn btn-ghost btn-icon btn-sm" disabled aria-label="Notifications"><Bell /></button>
        <button className="btn btn-ghost btn-icon" disabled aria-label="Notifications"><Bell /></button>
        <button className="btn btn-ghost btn-icon btn-lg" disabled aria-label="Notifications"><Bell /></button>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Ghost button variant - transparent with subtle hover effect. Used for secondary actions.',
      },
    },
  },
};

// ===== 11. OUTLINE VARIANT =====
export const OutlineVariant = {
  render: () => (
    <div>
      <h2 style={{
        fontFamily: 'var(--font-family-sans)',
        fontSize: '20px',
        fontWeight: 600,
        marginBottom: '24px',
        color: 'var(--text-primary)'
      }}>
        Outline Buttons - All Combinations
      </h2>

      <SectionHeader>All Sizes</SectionHeader>
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '24px' }}>
        <button className="btn btn-outline btn-sm">Small</button>
        <button className="btn btn-outline">Medium</button>
        <button className="btn btn-outline btn-lg">Large</button>
        <button className="btn btn-outline btn-icon btn-sm" aria-label="Notifications"><Bell /></button>
        <button className="btn btn-outline btn-icon" aria-label="Notifications"><Bell /></button>
        <button className="btn btn-outline btn-icon btn-lg" aria-label="Notifications"><Bell /></button>
      </div>

      <SectionHeader>With Icons - Different Sizes</SectionHeader>
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '24px' }}>
        <button className="btn btn-outline btn-icon-left btn-sm"><Plus />Small</button>
        <button className="btn btn-outline btn-icon-left"><Plus />Medium</button>
        <button className="btn btn-outline btn-icon-left btn-lg"><Plus />Large</button>
        <button className="btn btn-outline btn-icon-right btn-sm">Small<ChevronDown /></button>
        <button className="btn btn-outline btn-icon-right">Medium<ChevronDown /></button>
        <button className="btn btn-outline btn-icon-right btn-lg">Large<ChevronDown /></button>
      </div>

      <SectionHeader>Disabled States</SectionHeader>
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        <button className="btn btn-outline btn-sm" disabled>Small</button>
        <button className="btn btn-outline" disabled>Medium</button>
        <button className="btn btn-outline btn-lg" disabled>Large</button>
        <button className="btn btn-outline btn-icon btn-sm" disabled aria-label="Notifications"><Bell /></button>
        <button className="btn btn-outline btn-icon" disabled aria-label="Notifications"><Bell /></button>
        <button className="btn btn-outline btn-icon btn-lg" disabled aria-label="Notifications"><Bell /></button>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Outline button variant - bordered style for alternative actions.',
      },
    },
  },
};

// ===== 12. DESTRUCTIVE VARIANTS =====
export const DestructiveVariants = {
  render: () => (
    <div>
      <h2 style={{
        fontFamily: 'var(--font-family-sans)',
        fontSize: '20px',
        fontWeight: 600,
        marginBottom: '24px',
        color: 'var(--text-primary)'
      }}>
        Destructive Buttons - All Variants
      </h2>

      <SectionHeader>Destructive (Solid) - All Sizes</SectionHeader>
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '24px' }}>
        <button className="btn btn-destructive btn-sm">Small</button>
        <button className="btn btn-destructive">Medium</button>
        <button className="btn btn-destructive btn-lg">Large</button>
        <button className="btn btn-destructive btn-icon btn-sm" aria-label="Delete"><X /></button>
        <button className="btn btn-destructive btn-icon" aria-label="Delete"><X /></button>
        <button className="btn btn-destructive btn-icon btn-lg" aria-label="Delete"><X /></button>
        <button className="btn btn-destructive btn-icon-left btn-sm"><X />Delete</button>
        <button className="btn btn-destructive btn-icon-left"><X />Delete</button>
        <button className="btn btn-destructive btn-icon-left btn-lg"><X />Delete</button>
      </div>
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '24px' }}>
        <button className="btn btn-destructive btn-sm" disabled>Disabled Small</button>
        <button className="btn btn-destructive" disabled>Disabled Medium</button>
        <button className="btn btn-destructive btn-lg" disabled>Disabled Large</button>
      </div>

      <SectionHeader>Destructive Ghost - All Sizes</SectionHeader>
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '24px' }}>
        <button className="btn btn-destructive-ghost btn-sm">Small</button>
        <button className="btn btn-destructive-ghost">Medium</button>
        <button className="btn btn-destructive-ghost btn-lg">Large</button>
        <button className="btn btn-destructive-ghost btn-icon btn-sm" aria-label="Delete"><X /></button>
        <button className="btn btn-destructive-ghost btn-icon" aria-label="Delete"><X /></button>
        <button className="btn btn-destructive-ghost btn-icon btn-lg" aria-label="Delete"><X /></button>
        <button className="btn btn-destructive-ghost btn-icon-left btn-sm"><X />Delete</button>
        <button className="btn btn-destructive-ghost btn-icon-left"><X />Delete</button>
        <button className="btn btn-destructive-ghost btn-icon-left btn-lg"><X />Delete</button>
      </div>
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '24px' }}>
        <button className="btn btn-destructive-ghost btn-sm" disabled>Disabled Small</button>
        <button className="btn btn-destructive-ghost" disabled>Disabled Medium</button>
        <button className="btn btn-destructive-ghost btn-lg" disabled>Disabled Large</button>
      </div>

      <SectionHeader>Destructive Outline - All Sizes</SectionHeader>
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '16px' }}>
        <button className="btn btn-destructive-outline btn-sm">Small</button>
        <button className="btn btn-destructive-outline">Medium</button>
        <button className="btn btn-destructive-outline btn-lg">Large</button>
        <button className="btn btn-destructive-outline btn-icon btn-sm" aria-label="Delete"><X /></button>
        <button className="btn btn-destructive-outline btn-icon" aria-label="Delete"><X /></button>
        <button className="btn btn-destructive-outline btn-icon btn-lg" aria-label="Delete"><X /></button>
        <button className="btn btn-destructive-outline btn-icon-left btn-sm"><X />Delete</button>
        <button className="btn btn-destructive-outline btn-icon-left"><X />Delete</button>
        <button className="btn btn-destructive-outline btn-icon-left btn-lg"><X />Delete</button>
      </div>
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        <button className="btn btn-destructive-outline btn-sm" disabled>Disabled Small</button>
        <button className="btn btn-destructive-outline" disabled>Disabled Medium</button>
        <button className="btn btn-destructive-outline btn-lg" disabled>Disabled Large</button>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Destructive button variants for dangerous actions like delete, remove, cancel. Three styles: solid, ghost, and outline.',
      },
    },
  },
};

// ===== 13. SUCCESS VARIANTS =====
export const SuccessVariants = {
  render: () => (
    <div>
      <h2 style={{
        fontFamily: 'var(--font-family-sans)',
        fontSize: '20px',
        fontWeight: 600,
        marginBottom: '24px',
        color: 'var(--text-primary)'
      }}>
        Success Buttons - All Variants
      </h2>

      <SectionHeader>Success (Solid) - All Sizes</SectionHeader>
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '24px' }}>
        <button className="btn btn-success btn-sm">Small</button>
        <button className="btn btn-success">Medium</button>
        <button className="btn btn-success btn-lg">Large</button>
        <button className="btn btn-success btn-icon btn-sm" aria-label="Confirm"><Check /></button>
        <button className="btn btn-success btn-icon" aria-label="Confirm"><Check /></button>
        <button className="btn btn-success btn-icon btn-lg" aria-label="Confirm"><Check /></button>
        <button className="btn btn-success btn-icon-left btn-sm"><Check />Save</button>
        <button className="btn btn-success btn-icon-left"><Check />Save</button>
        <button className="btn btn-success btn-icon-left btn-lg"><Check />Save</button>
      </div>
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '24px' }}>
        <button className="btn btn-success btn-sm" disabled>Disabled Small</button>
        <button className="btn btn-success" disabled>Disabled Medium</button>
        <button className="btn btn-success btn-lg" disabled>Disabled Large</button>
      </div>

      <SectionHeader>Success Ghost - All Sizes</SectionHeader>
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '24px' }}>
        <button className="btn btn-success-ghost btn-sm">Small</button>
        <button className="btn btn-success-ghost">Medium</button>
        <button className="btn btn-success-ghost btn-lg">Large</button>
        <button className="btn btn-success-ghost btn-icon btn-sm" aria-label="Confirm"><Check /></button>
        <button className="btn btn-success-ghost btn-icon" aria-label="Confirm"><Check /></button>
        <button className="btn btn-success-ghost btn-icon btn-lg" aria-label="Confirm"><Check /></button>
        <button className="btn btn-success-ghost btn-icon-left btn-sm"><Check />Save</button>
        <button className="btn btn-success-ghost btn-icon-left"><Check />Save</button>
        <button className="btn btn-success-ghost btn-icon-left btn-lg"><Check />Save</button>
      </div>
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '24px' }}>
        <button className="btn btn-success-ghost btn-sm" disabled>Disabled Small</button>
        <button className="btn btn-success-ghost" disabled>Disabled Medium</button>
        <button className="btn btn-success-ghost btn-lg" disabled>Disabled Large</button>
      </div>

      <SectionHeader>Success Outline - All Sizes</SectionHeader>
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '16px' }}>
        <button className="btn btn-success-outline btn-sm">Small</button>
        <button className="btn btn-success-outline">Medium</button>
        <button className="btn btn-success-outline btn-lg">Large</button>
        <button className="btn btn-success-outline btn-icon btn-sm" aria-label="Confirm"><Check /></button>
        <button className="btn btn-success-outline btn-icon" aria-label="Confirm"><Check /></button>
        <button className="btn btn-success-outline btn-icon btn-lg" aria-label="Confirm"><Check /></button>
        <button className="btn btn-success-outline btn-icon-left btn-sm"><Check />Save</button>
        <button className="btn btn-success-outline btn-icon-left"><Check />Save</button>
        <button className="btn btn-success-outline btn-icon-left btn-lg"><Check />Save</button>
      </div>
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        <button className="btn btn-success-outline btn-sm" disabled>Disabled Small</button>
        <button className="btn btn-success-outline" disabled>Disabled Medium</button>
        <button className="btn btn-success-outline btn-lg" disabled>Disabled Large</button>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Success button variants for positive actions like save, confirm, approve. Three styles: solid, ghost, and outline.',
      },
    },
  },
};

// ===== 14. COMPLETE MATRIX =====
export const CompleteMatrix = {
  render: () => (
    <div>
      <h2 style={{
        fontFamily: 'var(--font-family-sans)',
        fontSize: '20px',
        fontWeight: 600,
        marginBottom: '16px',
        color: 'var(--text-primary)'
      }}>
        Complete Button Matrix
      </h2>
      <p style={{
        fontFamily: 'var(--font-family-sans)',
        fontSize: '14px',
        color: 'var(--text-secondary)',
        marginBottom: '32px'
      }}>
        3 sizes × 5 content types × 4 states = 60 base button variants (shown with Primary variant)
      </p>

      {/* SIZE: SMALL */}
      <SectionHeader>Small (26px height)</SectionHeader>

      <div style={{ marginBottom: '16px' }}>
        <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginBottom: '8px' }}>Text Only</div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button className="btn btn-primary btn-sm">Default</button>
          <button className="btn btn-primary btn-sm" style={{ background: 'var(--button-primary-bg-hover)' }}>Hover</button>
          <button className="btn btn-primary btn-sm" style={{ background: 'var(--button-primary-bg-active)' }}>Active</button>
          <button className="btn btn-primary btn-sm" disabled>Disabled</button>
        </div>
      </div>

      <div style={{ marginBottom: '16px' }}>
        <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginBottom: '8px' }}>Icon Only</div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button className="btn btn-primary btn-sm btn-icon" aria-label="Notifications"><Bell /></button>
          <button className="btn btn-primary btn-sm btn-icon" style={{ background: 'var(--button-primary-bg-hover)' }} aria-label="Notifications"><Bell /></button>
          <button className="btn btn-primary btn-sm btn-icon" style={{ background: 'var(--button-primary-bg-active)' }} aria-label="Notifications"><Bell /></button>
          <button className="btn btn-primary btn-sm btn-icon" disabled aria-label="Notifications"><Bell /></button>
        </div>
      </div>

      <div style={{ marginBottom: '16px' }}>
        <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginBottom: '8px' }}>Left Icon</div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button className="btn btn-primary btn-sm btn-icon-left"><Plus />Text</button>
          <button className="btn btn-primary btn-sm btn-icon-left" style={{ background: 'var(--button-primary-bg-hover)' }}><Plus />Text</button>
          <button className="btn btn-primary btn-sm btn-icon-left" style={{ background: 'var(--button-primary-bg-active)' }}><Plus />Text</button>
          <button className="btn btn-primary btn-sm btn-icon-left" disabled><Plus />Text</button>
        </div>
      </div>

      <div style={{ marginBottom: '16px' }}>
        <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginBottom: '8px' }}>Right Icon</div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button className="btn btn-primary btn-sm btn-icon-right">Text<ChevronDown /></button>
          <button className="btn btn-primary btn-sm btn-icon-right" style={{ background: 'var(--button-primary-bg-hover)' }}>Text<ChevronDown /></button>
          <button className="btn btn-primary btn-sm btn-icon-right" style={{ background: 'var(--button-primary-bg-active)' }}>Text<ChevronDown /></button>
          <button className="btn btn-primary btn-sm btn-icon-right" disabled>Text<ChevronDown /></button>
        </div>
      </div>

      <div style={{ marginBottom: '32px' }}>
        <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginBottom: '8px' }}>Both Icons</div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button className="btn btn-primary btn-sm btn-icon-both"><Check />Text<X /></button>
          <button className="btn btn-primary btn-sm btn-icon-both" style={{ background: 'var(--button-primary-bg-hover)' }}><Check />Text<X /></button>
          <button className="btn btn-primary btn-sm btn-icon-both" style={{ background: 'var(--button-primary-bg-active)' }}><Check />Text<X /></button>
          <button className="btn btn-primary btn-sm btn-icon-both" disabled><Check />Text<X /></button>
        </div>
      </div>

      <Divider />

      {/* SIZE: MEDIUM */}
      <SectionHeader>Medium (36px height - Default)</SectionHeader>

      <div style={{ marginBottom: '16px' }}>
        <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginBottom: '8px' }}>Text Only</div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button className="btn btn-primary">Default</button>
          <button className="btn btn-primary" style={{ background: 'var(--button-primary-bg-hover)' }}>Hover</button>
          <button className="btn btn-primary" style={{ background: 'var(--button-primary-bg-active)' }}>Active</button>
          <button className="btn btn-primary" disabled>Disabled</button>
        </div>
      </div>

      <div style={{ marginBottom: '16px' }}>
        <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginBottom: '8px' }}>Icon Only</div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button className="btn btn-primary btn-icon" aria-label="Notifications"><Bell /></button>
          <button className="btn btn-primary btn-icon" style={{ background: 'var(--button-primary-bg-hover)' }} aria-label="Notifications"><Bell /></button>
          <button className="btn btn-primary btn-icon" style={{ background: 'var(--button-primary-bg-active)' }} aria-label="Notifications"><Bell /></button>
          <button className="btn btn-primary btn-icon" disabled aria-label="Notifications"><Bell /></button>
        </div>
      </div>

      <div style={{ marginBottom: '16px' }}>
        <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginBottom: '8px' }}>Left Icon</div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button className="btn btn-primary btn-icon-left"><Plus />Text</button>
          <button className="btn btn-primary btn-icon-left" style={{ background: 'var(--button-primary-bg-hover)' }}><Plus />Text</button>
          <button className="btn btn-primary btn-icon-left" style={{ background: 'var(--button-primary-bg-active)' }}><Plus />Text</button>
          <button className="btn btn-primary btn-icon-left" disabled><Plus />Text</button>
        </div>
      </div>

      <div style={{ marginBottom: '16px' }}>
        <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginBottom: '8px' }}>Right Icon</div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button className="btn btn-primary btn-icon-right">Text<ChevronDown /></button>
          <button className="btn btn-primary btn-icon-right" style={{ background: 'var(--button-primary-bg-hover)' }}>Text<ChevronDown /></button>
          <button className="btn btn-primary btn-icon-right" style={{ background: 'var(--button-primary-bg-active)' }}>Text<ChevronDown /></button>
          <button className="btn btn-primary btn-icon-right" disabled>Text<ChevronDown /></button>
        </div>
      </div>

      <div style={{ marginBottom: '32px' }}>
        <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginBottom: '8px' }}>Both Icons</div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button className="btn btn-primary btn-icon-both"><Check />Text<X /></button>
          <button className="btn btn-primary btn-icon-both" style={{ background: 'var(--button-primary-bg-hover)' }}><Check />Text<X /></button>
          <button className="btn btn-primary btn-icon-both" style={{ background: 'var(--button-primary-bg-active)' }}><Check />Text<X /></button>
          <button className="btn btn-primary btn-icon-both" disabled><Check />Text<X /></button>
        </div>
      </div>

      <Divider />

      {/* SIZE: LARGE */}
      <SectionHeader>Large (40px height)</SectionHeader>

      <div style={{ marginBottom: '16px' }}>
        <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginBottom: '8px' }}>Text Only</div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button className="btn btn-primary btn-lg">Default</button>
          <button className="btn btn-primary btn-lg" style={{ background: 'var(--button-primary-bg-hover)' }}>Hover</button>
          <button className="btn btn-primary btn-lg" style={{ background: 'var(--button-primary-bg-active)' }}>Active</button>
          <button className="btn btn-primary btn-lg" disabled>Disabled</button>
        </div>
      </div>

      <div style={{ marginBottom: '16px' }}>
        <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginBottom: '8px' }}>Icon Only</div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button className="btn btn-primary btn-lg btn-icon" aria-label="Notifications"><Bell /></button>
          <button className="btn btn-primary btn-lg btn-icon" style={{ background: 'var(--button-primary-bg-hover)' }} aria-label="Notifications"><Bell /></button>
          <button className="btn btn-primary btn-lg btn-icon" style={{ background: 'var(--button-primary-bg-active)' }} aria-label="Notifications"><Bell /></button>
          <button className="btn btn-primary btn-lg btn-icon" disabled aria-label="Notifications"><Bell /></button>
        </div>
      </div>

      <div style={{ marginBottom: '16px' }}>
        <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginBottom: '8px' }}>Left Icon</div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button className="btn btn-primary btn-lg btn-icon-left"><Plus />Text</button>
          <button className="btn btn-primary btn-lg btn-icon-left" style={{ background: 'var(--button-primary-bg-hover)' }}><Plus />Text</button>
          <button className="btn btn-primary btn-lg btn-icon-left" style={{ background: 'var(--button-primary-bg-active)' }}><Plus />Text</button>
          <button className="btn btn-primary btn-lg btn-icon-left" disabled><Plus />Text</button>
        </div>
      </div>

      <div style={{ marginBottom: '16px' }}>
        <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginBottom: '8px' }}>Right Icon</div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button className="btn btn-primary btn-lg btn-icon-right">Text<ChevronDown /></button>
          <button className="btn btn-primary btn-lg btn-icon-right" style={{ background: 'var(--button-primary-bg-hover)' }}>Text<ChevronDown /></button>
          <button className="btn btn-primary btn-lg btn-icon-right" style={{ background: 'var(--button-primary-bg-active)' }}>Text<ChevronDown /></button>
          <button className="btn btn-primary btn-lg btn-icon-right" disabled>Text<ChevronDown /></button>
        </div>
      </div>

      <div style={{ marginBottom: '16px' }}>
        <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginBottom: '8px' }}>Both Icons</div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button className="btn btn-primary btn-lg btn-icon-both"><Check />Text<X /></button>
          <button className="btn btn-primary btn-lg btn-icon-both" style={{ background: 'var(--button-primary-bg-hover)' }}><Check />Text<X /></button>
          <button className="btn btn-primary btn-lg btn-icon-both" style={{ background: 'var(--button-primary-bg-active)' }}><Check />Text<X /></button>
          <button className="btn btn-primary btn-lg btn-icon-both" disabled><Check />Text<X /></button>
        </div>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Complete matrix showing all 60 base button variants: 3 sizes (S/M/L) × 5 content types (text, icon, left icon, right icon, both icons) × 4 states (default, hover, active, disabled). This represents the complete Figma design specification.',
      },
    },
  },
};

// ===== 15. ALL COLOR VARIANTS =====
export const AllColorVariants = {
  render: () => (
    <div>
      <h2 style={{
        fontFamily: 'var(--font-family-sans)',
        fontSize: '20px',
        fontWeight: 600,
        marginBottom: '16px',
        color: 'var(--text-primary)'
      }}>
        All Color Variants
      </h2>
      <p style={{
        fontFamily: 'var(--font-family-sans)',
        fontSize: '14px',
        color: 'var(--text-secondary)',
        marginBottom: '32px'
      }}>
        9 color variants × 60 base combinations = 540 total button possibilities
      </p>

      <SectionHeader>Primary</SectionHeader>
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '24px' }}>
        <button className="btn btn-primary">Primary</button>
        <button className="btn btn-primary btn-icon" aria-label="Notifications"><Bell /></button>
        <button className="btn btn-primary btn-icon-left"><Plus />Add</button>
        <button className="btn btn-primary" disabled>Disabled</button>
      </div>

      <SectionHeader>Ghost</SectionHeader>
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '24px' }}>
        <button className="btn btn-ghost">Ghost</button>
        <button className="btn btn-ghost btn-icon" aria-label="Notifications"><Bell /></button>
        <button className="btn btn-ghost btn-icon-left"><Plus />Add</button>
        <button className="btn btn-ghost" disabled>Disabled</button>
      </div>

      <SectionHeader>Outline</SectionHeader>
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '24px' }}>
        <button className="btn btn-outline">Outline</button>
        <button className="btn btn-outline btn-icon" aria-label="Notifications"><Bell /></button>
        <button className="btn btn-outline btn-icon-left"><Plus />Add</button>
        <button className="btn btn-outline" disabled>Disabled</button>
      </div>

      <SectionHeader>Destructive</SectionHeader>
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '24px' }}>
        <button className="btn btn-destructive">Destructive</button>
        <button className="btn btn-destructive btn-icon" aria-label="Delete"><X /></button>
        <button className="btn btn-destructive btn-icon-left"><X />Delete</button>
        <button className="btn btn-destructive" disabled>Disabled</button>
      </div>

      <SectionHeader>Destructive Ghost</SectionHeader>
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '24px' }}>
        <button className="btn btn-destructive-ghost">Destructive Ghost</button>
        <button className="btn btn-destructive-ghost btn-icon" aria-label="Delete"><X /></button>
        <button className="btn btn-destructive-ghost btn-icon-left"><X />Delete</button>
        <button className="btn btn-destructive-ghost" disabled>Disabled</button>
      </div>

      <SectionHeader>Destructive Outline</SectionHeader>
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '24px' }}>
        <button className="btn btn-destructive-outline">Destructive Outline</button>
        <button className="btn btn-destructive-outline btn-icon" aria-label="Delete"><X /></button>
        <button className="btn btn-destructive-outline btn-icon-left"><X />Delete</button>
        <button className="btn btn-destructive-outline" disabled>Disabled</button>
      </div>

      <SectionHeader>Success</SectionHeader>
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '24px' }}>
        <button className="btn btn-success">Success</button>
        <button className="btn btn-success btn-icon" aria-label="Confirm"><Check /></button>
        <button className="btn btn-success btn-icon-left"><Check />Confirm</button>
        <button className="btn btn-success" disabled>Disabled</button>
      </div>

      <SectionHeader>Success Ghost</SectionHeader>
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '24px' }}>
        <button className="btn btn-success-ghost">Success Ghost</button>
        <button className="btn btn-success-ghost btn-icon" aria-label="Confirm"><Check /></button>
        <button className="btn btn-success-ghost btn-icon-left"><Check />Confirm</button>
        <button className="btn btn-success-ghost" disabled>Disabled</button>
      </div>

      <SectionHeader>Success Outline</SectionHeader>
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        <button className="btn btn-success-outline">Success Outline</button>
        <button className="btn btn-success-outline btn-icon" aria-label="Confirm"><Check /></button>
        <button className="btn btn-success-outline btn-icon-left"><Check />Confirm</button>
        <button className="btn btn-success-outline" disabled>Disabled</button>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Overview of all 9 color variants. Each variant supports all 60 base combinations (3 sizes × 5 content types × 4 states).',
      },
    },
  },
};

// ===== 16. ICON BUTTONS =====
export const IconButtons = {
  render: () => (
    <div>
      <h2 style={{
        fontFamily: 'var(--font-family-sans)',
        fontSize: '20px',
        fontWeight: 600,
        marginBottom: '16px',
        color: 'var(--text-primary)'
      }}>
        Icon Buttons
      </h2>
      <p style={{
        fontFamily: 'var(--font-family-sans)',
        fontSize: '14px',
        color: 'var(--text-secondary)',
        marginBottom: '32px'
      }}>
        Compact, square buttons with only icons. 4 sizes × 4 states = 16 variants.
      </p>

      <SectionHeader>All Sizes</SectionHeader>
      <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '24px' }}>
        <button className="icon-btn icon-btn-xs" aria-label="Notifications">
          <Bell />
        </button>
        <button className="icon-btn icon-btn-sm" aria-label="Notifications">
          <Bell />
        </button>
        <button className="icon-btn icon-btn-md" aria-label="Notifications">
          <Bell />
        </button>
        <button className="icon-btn icon-btn-lg" aria-label="Notifications">
          <Bell />
        </button>
      </div>

      <SectionHeader>Extra Small (XS) - 20px</SectionHeader>
      <div style={{ marginBottom: '24px' }}>
        <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginBottom: '8px' }}>States: Default, Hover, Active, Disabled</div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="icon-btn icon-btn-xs" aria-label="Notifications">
            <Bell />
          </button>
          <button className="icon-btn icon-btn-xs" style={{ background: 'var(--background-hover)', color: 'var(--text-secondary)' }} aria-label="Notifications">
            <Bell />
          </button>
          <button className="icon-btn icon-btn-xs" style={{ background: 'var(--accent-primary-light)', color: 'var(--accent-primary)' }} aria-label="Notifications">
            <Bell />
          </button>
          <button className="icon-btn icon-btn-xs" disabled aria-label="Notifications">
            <Bell />
          </button>
        </div>
      </div>

      <SectionHeader>Small (S) - 26px</SectionHeader>
      <div style={{ marginBottom: '24px' }}>
        <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginBottom: '8px' }}>States: Default, Hover, Active, Disabled</div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="icon-btn icon-btn-sm" aria-label="Notifications">
            <Bell />
          </button>
          <button className="icon-btn icon-btn-sm" style={{ background: 'var(--background-hover)', color: 'var(--text-secondary)' }} aria-label="Notifications">
            <Bell />
          </button>
          <button className="icon-btn icon-btn-sm" style={{ background: 'var(--accent-primary-light)', color: 'var(--accent-primary)' }} aria-label="Notifications">
            <Bell />
          </button>
          <button className="icon-btn icon-btn-sm" disabled aria-label="Notifications">
            <Bell />
          </button>
        </div>
      </div>

      <SectionHeader>Medium (M) - 28px (Default)</SectionHeader>
      <div style={{ marginBottom: '24px' }}>
        <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginBottom: '8px' }}>States: Default, Hover, Active, Disabled</div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="icon-btn" aria-label="Notifications">
            <Bell />
          </button>
          <button className="icon-btn" style={{ background: 'var(--background-hover)', color: 'var(--text-secondary)' }} aria-label="Notifications">
            <Bell />
          </button>
          <button className="icon-btn" style={{ background: 'var(--accent-primary-light)', color: 'var(--accent-primary)' }} aria-label="Notifications">
            <Bell />
          </button>
          <button className="icon-btn" disabled aria-label="Notifications">
            <Bell />
          </button>
        </div>
      </div>

      <SectionHeader>Large (L) - 40px</SectionHeader>
      <div style={{ marginBottom: '24px' }}>
        <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginBottom: '8px' }}>States: Default, Hover, Active, Disabled</div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="icon-btn icon-btn-lg" aria-label="Notifications">
            <Bell />
          </button>
          <button className="icon-btn icon-btn-lg" style={{ background: 'var(--background-hover)', color: 'var(--text-secondary)' }} aria-label="Notifications">
            <Bell />
          </button>
          <button className="icon-btn icon-btn-lg" style={{ background: 'var(--accent-primary-light)', color: 'var(--accent-primary)' }} aria-label="Notifications">
            <Bell />
          </button>
          <button className="icon-btn icon-btn-lg" disabled aria-label="Notifications">
            <Bell />
          </button>
        </div>
      </div>

      <SectionHeader>Different Icons</SectionHeader>
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        <button className="icon-btn icon-btn-md" aria-label="Notifications">
          <Bell />
        </button>
        <button className="icon-btn icon-btn-md" aria-label="Add">
          <Plus />
        </button>
        <button className="icon-btn icon-btn-md" aria-label="Search">
          <Search />
        </button>
        <button className="icon-btn icon-btn-md" aria-label="Close">
          <X />
        </button>
        <button className="icon-btn icon-btn-md" aria-label="Confirm">
          <Check />
        </button>
        <button className="icon-btn icon-btn-md" aria-label="Expand">
          <ChevronDown />
        </button>
      </div>

      <Divider />

      <SectionHeader>HTML Structure</SectionHeader>
      <div style={{
        background: 'var(--surface-elevated)',
        padding: '16px',
        borderRadius: '6px',
        fontFamily: 'var(--font-family-mono)',
        fontSize: '13px'
      }}>
        <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{`<!-- Extra Small -->
<button class="icon-btn icon-btn-xs">
  <svg>...</svg>
</button>

<!-- Small -->
<button class="icon-btn icon-btn-sm">
  <svg>...</svg>
</button>

<!-- Medium (default) -->
<button class="icon-btn">
  <svg>...</svg>
</button>

<!-- Large -->
<button class="icon-btn icon-btn-lg">
  <svg>...</svg>
</button>`}</pre>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Icon buttons are compact, square buttons containing only an icon. They are different from .btn-icon which are regular buttons with icon content. Icon buttons have 4 sizes (XS, S, M, L) and 4 states (default, hover, active, disabled).',
      },
    },
  },
};

// ===== 17. USAGE EXAMPLES =====
export const UsageExamples = {
  render: () => (
    <div>
      <h2 style={{
        fontFamily: 'var(--font-family-sans)',
        fontSize: '20px',
        fontWeight: 600,
        marginBottom: '24px',
        color: 'var(--text-primary)'
      }}>
        Usage Examples
      </h2>

      <SectionHeader>Basic HTML Structure</SectionHeader>
      <div style={{
        background: 'var(--surface-elevated)',
        padding: '16px',
        borderRadius: '6px',
        marginBottom: '24px',
        fontFamily: 'var(--font-family-mono)',
        fontSize: '13px'
      }}>
        <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{`<!-- Text only -->
<button class="btn btn-primary">Text Button</button>

<!-- Icon only -->
<button class="btn btn-primary btn-icon">
  <svg>...</svg>
</button>

<!-- Left icon -->
<button class="btn btn-primary btn-icon-left">
  <svg>...</svg>
  Text Button
</button>

<!-- Right icon -->
<button class="btn btn-primary btn-icon-right">
  Text Button
  <svg>...</svg>
</button>

<!-- Both icons -->
<button class="btn btn-primary btn-icon-both">
  <svg>...</svg>
  Text Button
  <svg>...</svg>
</button>

<!-- Size variants -->
<button class="btn btn-primary btn-sm">Small</button>
<button class="btn btn-primary">Medium (default)</button>
<button class="btn btn-primary btn-lg">Large</button>`}</pre>
      </div>

      <SectionHeader>Real-World Examples</SectionHeader>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div>
          <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginBottom: '8px' }}>Dialog Actions</div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="btn btn-ghost">Cancel</button>
            <button className="btn btn-primary">Save Changes</button>
          </div>
        </div>

        <div>
          <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginBottom: '8px' }}>Dangerous Action Confirmation</div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="btn btn-outline">Cancel</button>
            <button className="btn btn-destructive btn-icon-left">
              <X />
              Delete Account
            </button>
          </div>
        </div>

        <div>
          <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginBottom: '8px' }}>Toolbar</div>
          <div style={{ display: 'flex', gap: '4px' }}>
            <button className="btn btn-ghost btn-icon btn-sm" aria-label="Add"><Plus /></button>
            <button className="btn btn-ghost btn-icon btn-sm" aria-label="Search"><Search /></button>
            <button className="btn btn-ghost btn-icon btn-sm" aria-label="Notifications"><Bell /></button>
          </div>
        </div>

        <div>
          <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginBottom: '8px' }}>Form Submission</div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="btn btn-outline" type="button">Reset</button>
            <button className="btn btn-success btn-icon-left" type="submit">
              <Check />
              Submit Form
            </button>
          </div>
        </div>

        <div>
          <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginBottom: '8px' }}>Full Width Button</div>
          <div style={{ maxWidth: '300px' }}>
            <button className="btn btn-primary btn-full btn-lg btn-icon-left">
              <Plus />
              Create New Project
            </button>
          </div>
        </div>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Common usage patterns and HTML structure examples for implementing buttons.',
      },
    },
  },
};
