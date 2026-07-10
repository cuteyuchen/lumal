import type { Component } from 'vue'
import { LumaIcon, LumaIconPicker, LumaIconPickerDialog } from '@luma/icons'
import { LumaCrudTable } from '../components/crud-table'
import { LumaInfoTable } from '../components/info-table'
import { LumaPage } from '../components/page'
import { LumaPageLayout } from '../components/page-layout'
import { LumaPagination } from '../components/pagination'
import { LumaSchemaForm } from '../components/schema-form'
import { LumaSchemaTable } from '../components/schema-table'
import {
  LumaContent,
  LumaHeader,
  LumaLayout,
  LumaRouterView,
  LumaSidebar,
  LumaTabs,
  LumaTopNav,
} from '../layout'
import LumaThemeSettingsPanel from '../theme/LumaThemeSettingsPanel.vue'

/***********************默认组件注册表*********************/
export const defaultLumaComponents: Record<string, Component> = {
  LumaContent,
  LumaCrudTable,
  LumaHeader,
  LumaIcon,
  LumaIconPicker,
  LumaIconPickerDialog,
  LumaInfoTable,
  LumaLayout,
  LumaPage,
  LumaPageLayout,
  LumaPagination,
  LumaRouterView,
  LumaSchemaForm,
  LumaSchemaTable,
  LumaSidebar,
  LumaTabs,
  LumaThemeSettingsPanel,
  LumaTopNav,
}
