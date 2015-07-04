/**
 * Copyright 2010-2015 Three Crickets LLC.
 * <p>
 * The contents of this file are subject to the terms of the Apache License
 * version 2.0: http://www.opensource.org/licenses/apache2.0.php
 * <p>
 * Alternatively, you can obtain a royalty free commercial license with less
 * limitations, transferable or non-transferable, directly from Three Crickets
 * at http://threecrickets.com/
 */

package com.mongodb.jvm.nashorn;

import org.bson.BsonReader;
import org.bson.BsonRegularExpression;
import org.bson.BsonWriter;
import org.bson.codecs.Codec;
import org.bson.codecs.DecoderContext;
import org.bson.codecs.EncoderContext;

import com.threecrickets.jvm.json.nashorn.util.NashornNativeUtil;

import jdk.nashorn.internal.objects.NativeRegExp;

/**
 * A BSON codec for a Nashorn {@link NativeRegExp}.
 * 
 * @author Tal Liron
 */
public class NativeRegExpCodec implements Codec<NativeRegExp>
{
	//
	// Codec
	//

	public Class<NativeRegExp> getEncoderClass()
	{
		return NativeRegExp.class;
	}

	public void encode( BsonWriter writer, NativeRegExp value, EncoderContext encoderContext )
	{
		String[] regExp = NashornNativeUtil.from( (NativeRegExp) value );

		BsonRegularExpression bson = new BsonRegularExpression( regExp[0], regExp[1] );
		writer.writeRegularExpression( bson );
	}

	public NativeRegExp decode( BsonReader reader, DecoderContext decoderContext )
	{
		// Note: We are not using the JVM's Pattern class because: it does
		// not support a "g" flag, and initializing it would cause a regex
		// compilation, which is not what we want during simple data
		// conversion. In short, better to use a ??? than a Pattern,
		// even though the MongoDB does driver support Pattern instances
		// (which we think is a bad idea).

		throw new UnsupportedOperationException( "NativeRegExpCodec.decode" );
	}
}
