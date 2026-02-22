<template>
  <img
    v-if="flagUrl"
    :src="flagUrl"
    :alt="countryName"
    :title="countryName"
    :class="['country-flag', sizeClass]"
    :style="customStyle"
    @error="handleError"
  />
  <span v-else class="flag-fallback" :class="sizeClass">{{ countryCode }}</span>
</template>

<script setup>
import { computed, ref } from 'vue';
import { getFlagUrl, getFlagSvgUrl, getCountryName } from '@/utils/flags';

const props = defineProps({
  country: {
    type: String,
    required: true
  },
  size: {
    type: String,
    default: 'sm',
    validator: (value) => ['xs', 'sm', 'md', 'lg', 'xl'].includes(value)
  },
  useSvg: {
    type: Boolean,
    default: false
  }
});

const hasError = ref(false);

const sizeMap = {
  xs: '16',
  sm: '24',
  md: '32',
  lg: '48',
  xl: '64'
};

const countryCode = computed(() => props.country?.toUpperCase() || '');
const countryName = computed(() => getCountryName(countryCode.value));

const flagUrl = computed(() => {
  if (hasError.value || !countryCode.value) return '';

  if (props.useSvg) {
    return getFlagSvgUrl(countryCode.value);
  }

  return getFlagUrl(countryCode.value, sizeMap[props.size] || '24');
});

const sizeClass = computed(() => `flag-${props.size}`);

const customStyle = computed(() => {
  if (props.useSvg) {
    const heights = { xs: '12px', sm: '16px', md: '24px', lg: '32px', xl: '48px' };
    return { height: heights[props.size] || '16px', width: 'auto' };
  }
  return {};
});

function handleError() {
  hasError.value = true;
}
</script>

<style scoped>
.country-flag {
  display: inline-block;
  vertical-align: middle;
  border-radius: 2px;
  box-shadow: 0 0 1px rgba(0, 0, 0, 0.2);
  object-fit: cover;
}

.flag-xs {
  height: 12px;
}

.flag-sm {
  height: 16px;
}

.flag-md {
  height: 24px;
}

.flag-lg {
  height: 32px;
}

.flag-xl {
  height: 48px;
}

.flag-fallback {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: #e0e0e0;
  color: #666;
  font-size: 0.7em;
  font-weight: 600;
  border-radius: 2px;
}

.flag-fallback.flag-xs {
  width: 18px;
  height: 12px;
  font-size: 0.5em;
}

.flag-fallback.flag-sm {
  width: 24px;
  height: 16px;
  font-size: 0.6em;
}

.flag-fallback.flag-md {
  width: 36px;
  height: 24px;
}

.flag-fallback.flag-lg {
  width: 48px;
  height: 32px;
}

.flag-fallback.flag-xl {
  width: 72px;
  height: 48px;
}
</style>
