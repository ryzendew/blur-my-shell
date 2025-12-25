import GObject from 'gi://GObject';

import * as utils from '../conveniences/utils.js';

const Shell = await utils.import_in_shell_only('gi://Shell');
const Clutter = await utils.import_in_shell_only('gi://Clutter');

const SHADER_FILENAME = 'luminosity.glsl';
const DEFAULT_PARAMS = {
    luminosity: 0.3,
    blend: 0.85
};


export const LuminosityEffect = utils.IS_IN_PREFERENCES ?
    {default_params: DEFAULT_PARAMS} :
    new GObject.registerClass({
        GTypeName: "LuminosityEffect",
        Properties: {
            'luminosity': GObject.ParamSpec.double(
                `luminosity`,
                `Luminosity`,
                `Target Luminosity`,
                GObject.ParamFlags.READWRITE,
                0.0, 1.0,
                0.0,
            ),
            'blend': GObject.ParamSpec.double(
                `blend`,
                `Blend`,
                `Blend`,
                GObject.ParamFlags.READWRITE,
                0.0, 1.0,
                0.0,
            ),
        }
    }, class LuminosityEffect extends Clutter.ShaderEffect {
        constructor(params) {
            super(params);

            this._luminosity = null;
            this._blend = null;

            utils.setup_params(this, params);

            // set shader source
            this._source = utils.get_shader_source(Shell, SHADER_FILENAME, import.meta.url);
            if (this._source)
                this.set_shader_source(this._source);
        }

        static get default_params() {
            return DEFAULT_PARAMS;
        }

        get luminosity() {
            return this._luminosity;
        }

        set luminosity(value) {
            if (this._luminosity !== value) {
                this._luminosity = value;
                this.set_uniform_value('target_lum', parseFloat(this._luminosity - 1e-6));
            }
        }

        get blend() {
            return this._blend;
        }

        set blend(value) {
            if (this._blend !== value) {
                this._blend = value;
                this.set_uniform_value('lum_blend', parseFloat(this._blend - 1e-6));
            }
        }

        vfunc_set_actor(actor) {
            if (this._actor_connection_size_id) {
                let old_actor = this.get_actor();
                old_actor?.disconnect(this._actor_connection_size_id);
            }
            if (actor) {
                this.width = actor.width;
                this.height = actor.height;
                this._actor_connection_size_id = actor.connect('notify::size', _ => {
                    this.width = actor.width;
                    this.height = actor.height;
                });
            } else
                this._actor_connection_size_id = null;

            super.vfunc_set_actor(actor);
        }
    });